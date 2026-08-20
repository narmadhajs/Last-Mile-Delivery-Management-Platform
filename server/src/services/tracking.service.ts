import { prisma } from '../db/prisma';
import { OrderStatus } from '@prisma/client';

export interface LogTrackingEventInput {
  orderId: string;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  actorId?: string;
  actorRole: string; // ADMIN, AGENT, CUSTOMER, SYSTEM
  actorName: string;
  lat?: number;
  lng?: number;
  locationText?: string;
  remarks?: string;
  failureReason?: string;
  proofData?: string;
}

export class TrackingService {
  /**
   * Appends an immutable tracking event to the ledger
   */
  public static async logEvent(data: LogTrackingEventInput) {
    const trackingEntry = await prisma.trackingHistory.create({
      data: {
        orderId: data.orderId,
        status: data.status,
        previousStatus: data.previousStatus,
        actorId: data.actorId,
        actorRole: data.actorRole,
        actorName: data.actorName,
        lat: data.lat,
        lng: data.lng,
        locationText: data.locationText,
        remarks: data.remarks,
        failureReason: data.failureReason,
        proofData: data.proofData,
        timestamp: new Date(),
      },
    });

    return trackingEntry;
  }

  /**
   * Retrieves the full immutable timeline for an order
   */
  public static async getTimelineForOrder(orderId: string) {
    return prisma.trackingHistory.findMany({
      where: { orderId },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * Retrieves all recent audit tracking events across the entire fleet/system
   */
  public static async getGlobalAuditLogs(limit: number = 50) {
    return prisma.trackingHistory.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            trackingNumber: true,
            orderType: true,
            paymentType: true,
            customer: { select: { name: true, email: true } },
          },
        },
      },
    });
  }
}
