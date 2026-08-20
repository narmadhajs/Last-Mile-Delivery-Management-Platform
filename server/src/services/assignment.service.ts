import { prisma } from '../db/prisma';
import { calculateHaversineDistance, estimateTravelTimeMinutes } from '../utils/haversine';
import { TrackingService } from './tracking.service';
import { NotificationService } from './notification.service';
import { AppError } from '../middlewares/errorHandler.middleware';
import { config } from '../config/env';

export interface AgentCandidate {
  agentId: string;
  userId: string;
  name: string;
  phone?: string | null;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
  currentLat: number;
  currentLng: number;
  distanceKm: number;
  estimatedArrivalMinutes: number;
  activeOrderCount: number;
  maxCapacity: number;
  isHomeZone: boolean;
  status: string;
  compositeScore: number;
}

export class AssignmentService {
  /**
   * Evaluates all candidate agents for a given order and returns scored rankings
   */
  public static async evaluateCandidatesForOrder(orderId: string): Promise<AgentCandidate[]> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { pickupZone: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Fetch active agents
    const agents = await prisma.deliveryAgent.findMany({
      where: {
        status: { in: ['AVAILABLE', 'BUSY'] },
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        homeZone: true,
      },
    });

    const candidates: AgentCandidate[] = [];

    for (const agent of agents) {
      // Skip if agent is at absolute capacity
      if (agent.activeOrderCount >= agent.maxCapacity) {
        continue;
      }

      // Calculate distance to pickup point
      const distanceKm = calculateHaversineDistance(
        agent.currentLat,
        agent.currentLng,
        order.pickupLat,
        order.pickupLng
      );

      const isHomeZone = Boolean(order.pickupZoneId && agent.homeZoneId === order.pickupZoneId);
      const estMinutes = estimateTravelTimeMinutes(distanceKm);

      // Scoring weights: Lower score is better
      // - Distance: 1 point per km
      // - Active Load: 3 points per existing active order
      // - Home Zone Bonus: -6 points if assigned to the order's pickup zone
      // - Rating Bonus: -2 points per star above 3.0
      // - Status penalty: +5 points if currently BUSY
      const distanceScore = distanceKm * 1.2;
      const loadScore = agent.activeOrderCount * 3.5;
      const zoneBonus = isHomeZone ? 8.0 : 0.0;
      const ratingBonus = (agent.rating - 3.0) * 2.0;
      const busyPenalty = agent.status === 'BUSY' ? 5.0 : 0.0;

      const compositeScore = Math.round(
        (distanceScore + loadScore + busyPenalty - zoneBonus - ratingBonus) * 100
      ) / 100;

      candidates.push({
        agentId: agent.id,
        userId: agent.user.id,
        name: agent.user.name,
        phone: agent.user.phone,
        vehicleType: agent.vehicleType,
        vehicleNumber: agent.vehicleNumber,
        rating: agent.rating,
        currentLat: agent.currentLat,
        currentLng: agent.currentLng,
        distanceKm,
        estimatedArrivalMinutes: estMinutes,
        activeOrderCount: agent.activeOrderCount,
        maxCapacity: agent.maxCapacity,
        isHomeZone,
        status: agent.status,
        compositeScore,
      });
    }

    // Sort by composite score ascending (best match first)
    return candidates.sort((a, b) => a.compositeScore - b.compositeScore);
  }

  /**
   * Auto-assigns the best available delivery agent to an order
   */
  public static async autoAssignOrder(
    orderId: string,
    actorId?: string,
    actorRole: string = 'SYSTEM',
    actorName: string = 'Auto-Assignment Engine'
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, pickupZone: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      throw new AppError(`Cannot assign agent to order with status ${order.status}`, 400);
    }

    const candidates = await this.evaluateCandidatesForOrder(orderId);

    if (candidates.length === 0) {
      throw new AppError(
        'No available delivery agents found within operational capacity. Please try again or assign manually.',
        404
      );
    }

    const bestAgent = candidates[0];

    // Atomically assign agent to order and increment agent active load
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const assigned = await tx.order.update({
        where: { id: orderId },
        data: {
          agentId: bestAgent.agentId,
          status: 'ASSIGNED',
        },
        include: {
          agent: {
            include: {
              user: { select: { name: true, phone: true, email: true } },
            },
          },
          customer: true,
        },
      });

      const updatedAgent = await tx.deliveryAgent.update({
        where: { id: bestAgent.agentId },
        data: {
          activeOrderCount: { increment: 1 },
          status:
            bestAgent.activeOrderCount + 1 >= bestAgent.maxCapacity
              ? 'BUSY'
              : bestAgent.status === 'AVAILABLE'
              ? 'AVAILABLE'
              : 'BUSY',
        },
      });

      return assigned;
    });

    // Create immutable tracking history log
    await TrackingService.logEvent({
      orderId: order.id,
      status: 'ASSIGNED',
      previousStatus: order.status,
      actorId,
      actorRole,
      actorName,
      lat: bestAgent.currentLat,
      lng: bestAgent.currentLng,
      locationText: `Agent Assigned: ${bestAgent.name} (${bestAgent.vehicleType} - ${bestAgent.vehicleNumber})`,
      remarks: `Intelligent auto-assignment matched nearest agent (${bestAgent.distanceKm} km away, Score: ${bestAgent.compositeScore}).`,
    });

    // Send notifications to Customer & Agent
    await NotificationService.sendOrderStatusNotification(
      updatedOrder,
      'ASSIGNED',
      `Delivery agent ${bestAgent.name} (${bestAgent.phone || 'N/A'}) has been assigned to your order ${order.trackingNumber}. Estimated pickup in ${bestAgent.estimatedArrivalMinutes} mins.`
    );

    return {
      order: updatedOrder,
      assignedAgent: bestAgent,
      totalCandidatesEvaluated: candidates.length,
    };
  }

  /**
   * Manually assigns a specific agent to an order
   */
  public static async manualAssignOrder(
    orderId: string,
    agentId: string,
    actorId: string,
    actorName: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const agent = await prisma.deliveryAgent.findUnique({
      where: { id: agentId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!agent) {
      throw new AppError('Delivery agent not found', 404);
    }

    // Previous agent decrement if reassigning
    if (order.agentId && order.agentId !== agentId) {
      await prisma.deliveryAgent.update({
        where: { id: order.agentId },
        data: {
          activeOrderCount: { decrement: 1 },
          status: 'AVAILABLE',
        },
      });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const assigned = await tx.order.update({
        where: { id: orderId },
        data: {
          agentId: agent.id,
          status: 'ASSIGNED',
        },
        include: {
          agent: {
            include: { user: { select: { name: true, phone: true } } },
          },
          customer: true,
        },
      });

      await tx.deliveryAgent.update({
        where: { id: agent.id },
        data: {
          activeOrderCount: { increment: 1 },
        },
      });

      return assigned;
    });

    const dist = calculateHaversineDistance(
      agent.currentLat,
      agent.currentLng,
      order.pickupLat,
      order.pickupLng
    );

    await TrackingService.logEvent({
      orderId: order.id,
      status: 'ASSIGNED',
      previousStatus: order.status,
      actorId,
      actorRole: 'ADMIN',
      actorName,
      lat: agent.currentLat,
      lng: agent.currentLng,
      locationText: `Manual Assignment: ${agent.user.name} (${agent.vehicleType} - ${agent.vehicleNumber})`,
      remarks: `Admin manually assigned agent ${agent.user.name} (${dist} km away from pickup point).`,
    });

    await NotificationService.sendOrderStatusNotification(
      updatedOrder,
      'ASSIGNED',
      `Delivery agent ${agent.user.name} has been assigned to your order ${order.trackingNumber}.`
    );

    return updatedOrder;
  }
}
