import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { AssignmentService } from '../services/assignment.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler.middleware';
import { OrderStatus, OrderType, PaymentType } from '@prisma/client';

export class OrderController {
  /**
   * Create an order
   */
  public static async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new AppError('Unauthorized', 401);

      const customerId = user.role === 'ADMIN' && req.body.customerId ? req.body.customerId : user.id;

      const result = await OrderService.createOrder(
        {
          ...req.body,
          customerId,
        },
        user.role
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get filtered orders list
   */
  public static async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const { status, zoneId, agentId, orderType, paymentType, search, limit, page } = req.query;

      let customerIdFilter: string | undefined = undefined;
      let agentIdFilter: string | undefined = agentId as string;

      // Restrict customers to only their orders
      if (user?.role === 'CUSTOMER') {
        customerIdFilter = user.id;
      } else if (user?.role === 'AGENT' && user.agentId) {
        agentIdFilter = user.agentId;
      }

      const result = await OrderService.getOrders({
        customerId: customerIdFilter,
        agentId: agentIdFilter,
        status: status as OrderStatus,
        zoneId: zoneId as string,
        orderType: orderType as OrderType,
        paymentType: paymentType as PaymentType,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        page: page ? parseInt(page as string, 10) : 1,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single order by ID or Tracking Number
   */
  public static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderByTrackingOrId(id);
      res.json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delivery Agent updates order status
   */
  public static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const { id } = req.params;
      const { status, remarks, failureReason, proofSignature, proofPhotoUrl, proofOtp, lat, lng, locationText } = req.body;

      const updatedOrder = await OrderService.updateOrderStatus({
        orderId: id,
        status: status as OrderStatus,
        actorId: user?.id,
        actorRole: user?.role || 'AGENT',
        actorName: user?.name || 'Delivery Partner',
        remarks,
        failureReason,
        proofSignature,
        proofPhotoUrl,
        proofOtp,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
        locationText,
      });

      res.json({
        success: true,
        data: updatedOrder,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin status override
   */
  public static async adminOverrideStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const { id } = req.params;
      const { status, remarks } = req.body;

      const updatedOrder = await OrderService.updateOrderStatus(
        {
          orderId: id,
          status: status as OrderStatus,
          actorId: user?.id,
          actorRole: 'ADMIN',
          actorName: user?.name || 'Administrator',
          remarks: `Admin Override: ${remarks || 'Manual state modification'}`,
        },
        true // Admin override flag
      );

      res.json({
        success: true,
        data: updatedOrder,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Evaluate candidate agents for an order
   */
  public static async getCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const candidates = await AssignmentService.evaluateCandidatesForOrder(id);
      res.json({
        success: true,
        data: candidates,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Trigger Auto-Assignment for an order
   */
  public static async autoAssign(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const { id } = req.params;

      const result = await AssignmentService.autoAssignOrder(
        id,
        user?.id,
        user?.role || 'ADMIN',
        user?.name || 'Administrator'
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Manually assign agent
   */
  public static async manualAssign(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const { id } = req.params;
      const { agentId } = req.body;

      if (!agentId) {
        throw new AppError('agentId is required for manual assignment', 400);
      }

      const result = await AssignmentService.manualAssignOrder(
        id,
        agentId,
        user?.id || 'admin',
        user?.name || 'Administrator'
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Customer reschedules a failed delivery
   */
  public static async reschedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const { id } = req.params;
      const { rescheduledDate, timeSlot, remarks } = req.body;

      if (!rescheduledDate || !timeSlot) {
        throw new AppError('rescheduledDate and timeSlot are required', 400);
      }

      const result = await OrderService.rescheduleDelivery({
        orderId: id,
        rescheduledDate,
        timeSlot,
        remarks,
        actorId: user?.id,
        actorName: user?.name,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
