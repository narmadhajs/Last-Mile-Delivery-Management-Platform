import { prisma } from '../db/prisma';
import { RateEngineService, RateCalculationInput } from './rateEngine.service';
import { AssignmentService } from './assignment.service';
import { TrackingService } from './tracking.service';
import { NotificationService } from './notification.service';
import { AppError } from '../middlewares/errorHandler.middleware';
import { OrderStatus, OrderType, PaymentType, PaymentStatus } from '@prisma/client';

export interface CreateOrderInput extends RateCalculationInput {
  customerId: string;
  pickupAddress: string;
  pickupCity: string;
  pickupContactName: string;
  pickupContactPhone: string;
  dropAddress: string;
  dropCity: string;
  dropContactName: string;
  dropContactPhone: string;
  packageCategory?: string;
  specialInstructions?: string;
  autoAssignAgent?: boolean;
}

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
  actorId?: string;
  actorRole: string; // ADMIN, AGENT, SYSTEM, CUSTOMER
  actorName: string;
  lat?: number;
  lng?: number;
  locationText?: string;
  remarks?: string;
  failureReason?: string;
  proofSignature?: string;
  proofPhotoUrl?: string;
  proofOtp?: string;
}

export interface RescheduleOrderInput {
  orderId: string;
  rescheduledDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:00 - 13:00" | "14:00 - 18:00"
  remarks?: string;
  actorId?: string;
  actorName?: string;
}

export class OrderService {
  /**
   * Generates a unique, high-readability tracking number: e.g. "TRK-2026-X8392"
   */
  private static generateTrackingNumber(): string {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `TRK-${year}-${randomPart}`;
  }

  /**
   * Creates a new delivery order with auto-calculated rates and zone detection
   */
  public static async createOrder(input: CreateOrderInput, createdByRole: string = 'CUSTOMER') {
    // 1. Run dynamic Rate Calculation Engine
    const rateResult = await RateEngineService.calculateRate(input);

    // 2. Generate tracking number
    let trackingNumber = this.generateTrackingNumber();
    let isUnique = false;
    while (!isUnique) {
      const existing = await prisma.order.findUnique({ where: { trackingNumber } });
      if (!existing) isUnique = true;
      else trackingNumber = this.generateTrackingNumber();
    }

    // 3. Create Order record
    const newOrder = await prisma.order.create({
      data: {
        trackingNumber,
        customerId: input.customerId,
        orderType: input.orderType as OrderType,
        paymentType: input.paymentType as PaymentType,
        paymentStatus: input.paymentType === 'PREPAID' ? PaymentStatus.PAID : PaymentStatus.PENDING_COLLECTION,
        
        pickupAddress: input.pickupAddress,
        pickupPincode: input.pickupPincode,
        pickupArea: input.pickupArea,
        pickupCity: input.pickupCity,
        pickupLat: input.pickupLat || rateResult.pickupZone.id ? 19.0760 : 0,
        pickupLng: input.pickupLng || 72.8777,
        pickupContactName: input.pickupContactName,
        pickupContactPhone: input.pickupContactPhone,
        pickupZoneId: rateResult.pickupZone.id,
        
        dropAddress: input.dropAddress,
        dropPincode: input.dropPincode,
        dropArea: input.dropArea,
        dropCity: input.dropCity,
        dropLat: input.dropLat || 19.1136,
        dropLng: input.dropLng || 72.8697,
        dropContactName: input.dropContactName,
        dropContactPhone: input.dropContactPhone,
        dropZoneId: rateResult.dropZone.id,
        
        lengthCm: input.lengthCm,
        widthCm: input.widthCm,
        heightCm: input.heightCm,
        actualWeightKg: rateResult.actualWeightKg,
        volumetricWeightKg: rateResult.volumetricWeightKg,
        chargeableWeightKg: rateResult.chargeableWeightKg,
        
        isIntraZone: rateResult.isIntraZone,
        baseRate: rateResult.rateCard.baseRate,
        incrementalRate: rateResult.rateCard.incrementalRate,
        baseCharge: rateResult.baseCharge,
        incrementalCharge: rateResult.incrementalCharge,
        codSurcharge: rateResult.codSurcharge,
        totalAmount: rateResult.totalAmount,
        declaredPackageValue: input.declaredValue,
        packageCategory: input.packageCategory || 'Standard Parcel',
        specialInstructions: input.specialInstructions,
        
        status: OrderStatus.CONFIRMED,
        scheduledDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day default
      },
      include: {
        customer: true,
        pickupZone: true,
        dropZone: true,
      },
    });

    // 4. Log initial immutable tracking history
    await TrackingService.logEvent({
      orderId: newOrder.id,
      status: OrderStatus.CONFIRMED,
      actorId: input.customerId,
      actorRole: createdByRole,
      actorName: input.pickupContactName || 'Customer',
      locationText: `Order Placed in ${rateResult.pickupZone.name} (${rateResult.pickupZone.code})`,
      remarks: `Order created with auto-calculated charge ₹${rateResult.totalAmount} (${rateResult.billedOn === 'VOLUMETRIC_WEIGHT' ? 'Volumetric weight applied' : 'Actual weight applied'}).`,
    });

    // 5. Send order confirmation notification
    await NotificationService.sendOrderStatusNotification(newOrder, OrderStatus.CONFIRMED);

    // 6. Auto-assign agent if requested (or default behavior)
    let assignedInfo = null;
    if (input.autoAssignAgent !== false) {
      try {
        assignedInfo = await AssignmentService.autoAssignOrder(
          newOrder.id,
          input.customerId,
          'SYSTEM',
          'Intelligent Auto-Assignment'
        );
      } catch (err: any) {
        // Agent auto-assignment error handled gracefully (order remains CONFIRMED waiting for agent)
      }
    }

    return {
      order: newOrder,
      rateBreakdown: rateResult,
      assignment: assignedInfo,
    };
  }

  /**
   * Validates state transitions against the business lifecycle state machine
   */
  private static validateStateTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    isAdminOverride: boolean = false
  ): void {
    if (isAdminOverride) return; // Admin can override any state with audit trail

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      DRAFT: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      CONFIRMED: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
      ASSIGNED: [OrderStatus.PICKED_UP, OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
      PICKED_UP: [OrderStatus.IN_TRANSIT, OrderStatus.FAILED],
      IN_TRANSIT: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.FAILED],
      OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.FAILED],
      DELIVERED: [], // Terminal state
      FAILED: [OrderStatus.RESCHEDULED, OrderStatus.CANCELLED],
      RESCHEDULED: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
      CANCELLED: [], // Terminal state
    };

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${targetStatus}. Allowed transitions: [${allowed.join(', ')}]`,
        400
      );
    }
  }

  /**
   * Updates an order status with immutable tracking log, agent queue management, and notifications
   */
  public static async updateOrderStatus(
    input: UpdateOrderStatusInput,
    isAdminOverride: boolean = false
  ) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: {
        agent: { include: { user: true } },
        customer: true,
        pickupZone: true,
        dropZone: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Validate transition
    this.validateStateTransition(order.status, input.status, isAdminOverride);

    // Prepare update data
    const updateData: any = {
      status: input.status,
    };

    if (input.proofSignature) updateData.proofSignature = input.proofSignature;
    if (input.proofPhotoUrl) updateData.proofPhotoUrl = input.proofPhotoUrl;
    if (input.proofOtp) updateData.proofOtp = input.proofOtp;

    // Handle DELIVERED
    if (input.status === OrderStatus.DELIVERED) {
      if (order.paymentType === 'COD') {
        updateData.paymentStatus = PaymentStatus.COLLECTED;
      }
      // Decrement agent load & increment delivery count
      if (order.agentId) {
        await prisma.deliveryAgent.update({
          where: { id: order.agentId },
          data: {
            activeOrderCount: { decrement: 1 },
            totalDeliveries: { increment: 1 },
            status: 'AVAILABLE',
          },
        });
      }
    }

    // Handle FAILED
    if (input.status === OrderStatus.FAILED) {
      updateData.failureReason = input.failureReason || 'Delivery attempt unsuccessful';
      updateData.failureCount = { increment: 1 };

      // Free up agent load so agent can handle other tasks
      if (order.agentId) {
        await prisma.deliveryAgent.update({
          where: { id: order.agentId },
          data: {
            activeOrderCount: { decrement: 1 },
            status: 'AVAILABLE',
          },
        });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: input.orderId },
      data: updateData,
      include: {
        agent: { include: { user: true } },
        customer: true,
        pickupZone: true,
        dropZone: true,
      },
    });

    // Immutable Tracking History Entry
    await TrackingService.logEvent({
      orderId: order.id,
      status: input.status,
      previousStatus: order.status,
      actorId: input.actorId,
      actorRole: input.actorRole,
      actorName: input.actorName,
      lat: input.lat || (input.actorRole === 'AGENT' && order.agent ? order.agent.currentLat : undefined),
      lng: input.lng || (input.actorRole === 'AGENT' && order.agent ? order.agent.currentLng : undefined),
      locationText: input.locationText || `Status changed to ${input.status}`,
      remarks: input.remarks || (isAdminOverride ? `Admin override: status updated to ${input.status}` : undefined),
      failureReason: input.failureReason,
      proofData: input.proofSignature ? 'Proof of Delivery (Signature Attached)' : undefined,
    });

    // Notify Customer
    await NotificationService.sendOrderStatusNotification(
      updatedOrder,
      input.status,
      input.remarks
    );

    return updatedOrder;
  }

  /**
   * Reschedules a failed delivery and triggers agent re-assignment
   */
  public static async rescheduleDelivery(input: RescheduleOrderInput) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      include: { customer: true, agent: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== OrderStatus.FAILED && order.status !== OrderStatus.RESCHEDULED) {
      throw new AppError(
        `Only failed orders can be rescheduled. Current status: ${order.status}`,
        400
      );
    }

    const rescheduledDateObj = new Date(input.rescheduledDate);

    // Update order status to RESCHEDULED
    const updatedOrder = await prisma.order.update({
      where: { id: input.orderId },
      data: {
        status: OrderStatus.RESCHEDULED,
        rescheduledDeliveryDate: rescheduledDateObj,
        rescheduleTimeSlot: input.timeSlot,
        rescheduleRemarks: input.remarks,
      },
      include: {
        customer: true,
        agent: true,
      },
    });

    // Log tracking event
    await TrackingService.logEvent({
      orderId: order.id,
      status: OrderStatus.RESCHEDULED,
      previousStatus: order.status,
      actorId: input.actorId,
      actorRole: 'CUSTOMER',
      actorName: input.actorName || order.customer.name,
      locationText: `Rescheduled for ${input.rescheduledDate} (${input.timeSlot})`,
      remarks: `Customer requested rescheduling. Slot: ${input.timeSlot}. Notes: ${input.remarks || 'None'}`,
    });

    // Send confirmation notification
    await NotificationService.sendOrderStatusNotification(
      updatedOrder,
      OrderStatus.RESCHEDULED,
      `Your delivery is rescheduled for ${input.rescheduledDate} (${input.timeSlot}).`
    );

    // Re-assign optimal agent for this slot
    let reassignment = null;
    try {
      reassignment = await AssignmentService.autoAssignOrder(
        order.id,
        input.actorId,
        'SYSTEM',
        'Auto-Reassignment Engine'
      );
    } catch (err) {
      // Reassignment will be handled by admin or next available run
    }

    return {
      order: updatedOrder,
      reassignment,
    };
  }

  /**
   * Retrieves an order by tracking number or UUID with full relational graph
   */
  public static async getOrderByTrackingOrId(identifier: string) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ trackingNumber: identifier }, { id: identifier }],
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        agent: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        pickupZone: true,
        dropZone: true,
        trackingHistory: {
          orderBy: { timestamp: 'asc' },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  /**
   * Queries orders with advanced multi-field filtering
   */
  public static async getOrders(filters: {
    customerId?: string;
    agentId?: string;
    status?: OrderStatus;
    zoneId?: string;
    orderType?: OrderType;
    paymentType?: PaymentType;
    search?: string;
    limit?: number;
    page?: number;
  }) {
    const {
      customerId,
      agentId,
      status,
      zoneId,
      orderType,
      paymentType,
      search,
      limit = 50,
      page = 1,
    } = filters;

    const whereClause: any = {};

    if (customerId) whereClause.customerId = customerId;
    if (agentId) whereClause.agentId = agentId;
    if (status) whereClause.status = status;
    if (orderType) whereClause.orderType = orderType;
    if (paymentType) whereClause.paymentType = paymentType;

    if (zoneId) {
      whereClause.OR = [{ pickupZoneId: zoneId }, { dropZoneId: zoneId }];
    }

    if (search) {
      const searchLower = search.trim();
      whereClause.OR = [
        ...(whereClause.OR || []),
        { trackingNumber: { contains: searchLower } },
        { pickupAddress: { contains: searchLower } },
        { dropAddress: { contains: searchLower } },
        { pickupContactName: { contains: searchLower } },
        { dropContactName: { contains: searchLower } },
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          agent: {
            include: {
              user: { select: { id: true, name: true, phone: true } },
            },
          },
          pickupZone: true,
          dropZone: true,
          _count: { select: { trackingHistory: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
