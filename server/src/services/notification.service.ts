import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { OrderStatus } from '@prisma/client';

export class NotificationService {
  /**
   * Generates and stores status change notifications (Email & SMS)
   */
  public static async sendOrderStatusNotification(
    order: any,
    status: OrderStatus,
    customMessage?: string
  ) {
    const customerEmail = order.customer?.email || order.dropContactPhone || 'customer@example.com';
    const customerPhone = order.dropContactPhone || order.customer?.phone || '+91-9876543210';
    const customerName = order.dropContactName || order.customer?.name || 'Valued Customer';
    const trackingNumber = order.trackingNumber;

    let emailTitle = '';
    let emailBody = '';
    let smsBody = '';

    switch (status) {
      case 'CONFIRMED':
        emailTitle = `Order Confirmed: ${trackingNumber}`;
        emailBody = `Hello ${customerName},\n\nYour delivery order #${trackingNumber} has been received and confirmed. Total Charge: ₹${order.totalAmount}. We are allocating the nearest delivery agent.\n\nTrack live: http://localhost:5173/track/${trackingNumber}`;
        smsBody = `LogiTrack: Order ${trackingNumber} confirmed. Total: ₹${order.totalAmount}. Track live at: http://localhost:5173/track/${trackingNumber}`;
        break;

      case 'ASSIGNED':
        const agentName = order.agent?.user?.name || 'Your delivery partner';
        const agentPhone = order.agent?.user?.phone || '';
        emailTitle = `Delivery Agent Assigned: ${trackingNumber}`;
        emailBody = `Hello ${customerName},\n\nDelivery partner ${agentName} (${agentPhone}) has been assigned to pick up and deliver order #${trackingNumber}.\n\nTrack live: http://localhost:5173/track/${trackingNumber}`;
        smsBody = `LogiTrack: Agent ${agentName} (${agentPhone}) is assigned to your delivery ${trackingNumber}. Track: http://localhost:5173/track/${trackingNumber}`;
        break;

      case 'PICKED_UP':
        emailTitle = `Package Picked Up: ${trackingNumber}`;
        emailBody = `Hello ${customerName},\n\nGreat news! Your package for order #${trackingNumber} has been picked up from ${order.pickupCity} and is on its way.\n\nTrack live: http://localhost:5173/track/${trackingNumber}`;
        smsBody = `LogiTrack: Package ${trackingNumber} picked up successfully. Track: http://localhost:5173/track/${trackingNumber}`;
        break;

      case 'IN_TRANSIT':
        emailTitle = `In Transit: ${trackingNumber}`;
        emailBody = `Hello ${customerName},\n\nYour order #${trackingNumber} is currently in transit between logistic sorting facilities.\n\nTrack live: http://localhost:5173/track/${trackingNumber}`;
        smsBody = `LogiTrack: Order ${trackingNumber} is in transit towards your local delivery hub.`;
        break;

      case 'OUT_FOR_DELIVERY':
        emailTitle = `Out for Delivery: ${trackingNumber}`;
        emailBody = `Hello ${customerName},\n\nYour package #${trackingNumber} is OUT FOR DELIVERY! Please be available at ${order.dropAddress}. ${order.paymentType === 'COD' ? `Amount to pay on delivery: ₹${order.totalAmount}` : 'Prepaid package.'}\n\nTrack live: http://localhost:5173/track/${trackingNumber}`;
        smsBody = `LogiTrack: Order ${trackingNumber} is OUT FOR DELIVERY today! ${order.paymentType === 'COD' ? `Keep ₹${order.totalAmount} ready.` : ''} Track: http://localhost:5173/track/${trackingNumber}`;
        break;

      case 'DELIVERED':
        emailTitle = `Package Delivered: ${trackingNumber}`;
        emailBody = `Hello ${customerName},\n\nYour order #${trackingNumber} was successfully DELIVERED at ${new Date().toLocaleTimeString()}! Thank you for using LogiTrack Last-Mile Logistics.\n\nView proof of delivery: http://localhost:5173/track/${trackingNumber}`;
        smsBody = `LogiTrack: Order ${trackingNumber} delivered successfully. Thank you for shipping with us!`;
        break;

      case 'FAILED':
        const reason = order.failureReason || 'Customer unavailable';
        emailTitle = `Delivery Attempt Failed: ${trackingNumber}`;
        emailBody = `Hello ${customerName},\n\nWe attempted to deliver your package #${trackingNumber}, but the delivery could not be completed. Reason: "${reason}".\n\n👉 You can choose your preferred date and time slot to reschedule your delivery here: http://localhost:5173/track/${trackingNumber}?reschedule=true`;
        smsBody = `LogiTrack: Delivery attempt failed for ${trackingNumber} (${reason}). Please reschedule your delivery slot now: http://localhost:5173/track/${trackingNumber}`;
        break;

      case 'RESCHEDULED':
        const slot = order.rescheduleTimeSlot || 'Next available slot';
        emailTitle = `Delivery Rescheduled: ${trackingNumber}`;
        emailBody = `Hello ${customerName},\n\nYour delivery order #${trackingNumber} has been rescheduled for ${order.rescheduledDeliveryDate ? new Date(order.rescheduledDeliveryDate).toLocaleDateString() : 'tomorrow'} (${slot}). We will assign a delivery partner for your slot.\n\nTrack live: http://localhost:5173/track/${trackingNumber}`;
        smsBody = `LogiTrack: Delivery ${trackingNumber} rescheduled to ${slot}. Track: http://localhost:5173/track/${trackingNumber}`;
        break;

      default:
        emailTitle = `Order Update: ${trackingNumber}`;
        emailBody = customMessage || `Status updated to ${status} for order #${trackingNumber}.`;
        smsBody = customMessage || `LogiTrack: Status updated to ${status} for order ${trackingNumber}.`;
        break;
    }

    if (customMessage) {
      emailBody += `\n\nNote: ${customMessage}`;
    }

    // Save Email Notification
    const emailNotif = await prisma.notification.create({
      data: {
        orderId: order.id,
        recipientUserId: order.customerId,
        recipientEmail: customerEmail,
        recipientPhone: customerPhone,
        channel: 'EMAIL',
        title: emailTitle,
        message: emailBody,
        status: 'SENT',
        metadata: JSON.stringify({ status, trackingNumber }),
      },
    });

    // Save SMS Notification
    const smsNotif = await prisma.notification.create({
      data: {
        orderId: order.id,
        recipientUserId: order.customerId,
        recipientEmail: customerEmail,
        recipientPhone: customerPhone,
        channel: 'SMS',
        title: `SMS Alert: ${status}`,
        message: smsBody,
        status: 'SENT',
        metadata: JSON.stringify({ status, trackingNumber }),
      },
    });

    logger.info(`[NOTIFICATION SENT] Email & SMS dispatched for order ${trackingNumber} [${status}]`);
    return { emailNotif, smsNotif };
  }

  public static async getNotificationsForUser(userId: string) {
    return prisma.notification.findMany({
      where: { recipientUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  public static async getAllNotifications(limit: number = 100) {
    return prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        order: {
          select: {
            id: true,
            trackingNumber: true,
            status: true,
          },
        },
      },
    });
  }
}
