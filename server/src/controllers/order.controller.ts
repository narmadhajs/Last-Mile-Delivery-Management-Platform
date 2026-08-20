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

      const customerId = user.role === 'ADMIN' && req.body.customerId ? (req.body.customerId as string) : user.id;

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
      let agentIdFilter: string | undefined = agentId ? (agentId as string) : undefined;

      // Restrict customers to only their orders
      if (user?.role === 'CUSTOMER') {
        customerIdFilter = user.id;
      } else if (user?.role === 'AGENT' && user.agentId) {
        agentIdFilter = user.agentId;
      }

      const result = await OrderService.getOrders({
        customerId: customerIdFilter,
        agentId: agentIdFilter,
        status: status ? ((status as string) as OrderStatus) : undefined,
        zoneId: zoneId ? (zoneId as string) : undefined,
        orderType: orderType ? ((orderType as string) as OrderType) : undefined,
        paymentType: paymentType ? ((paymentType as string) as PaymentType) : undefined,
        search: search ? (search as string) : undefined,
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
      const id = req.params.id as string;
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
      const id = req.params.id as string;
      const { status, remarks, failureReason, proofSignature, proofPhotoUrl, proofOtp, lat, lng, locationText } = req.body;

      const updatedOrder = await OrderService.updateOrderStatus({
        orderId: id,
        status: (status as string) as OrderStatus,
        actorId: user?.id,
        actorRole: user?.role || 'AGENT',
        actorName: user?.name || 'Delivery Partner',
        remarks: remarks ? (remarks as string) : undefined,
        failureReason: failureReason ? (failureReason as string) : undefined,
        proofSignature: proofSignature ? (proofSignature as string) : undefined,
        proofPhotoUrl: proofPhotoUrl ? (proofPhotoUrl as string) : undefined,
        proofOtp: proofOtp ? (proofOtp as string) : undefined,
        lat: lat !== undefined ? parseFloat(String(lat)) : undefined,
        lng: lng !== undefined ? parseFloat(String(lng)) : undefined,
        locationText: locationText ? (locationText as string) : undefined,
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
      const id = req.params.id as string;
      const { status, remarks } = req.body;

      const updatedOrder = await OrderService.updateOrderStatus(
        {
          orderId: id,
          status: (status as string) as OrderStatus,
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
      const id = req.params.id as string;
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
      const id = req.params.id as string;

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
      const id = req.params.id as string;
      const { agentId } = req.body;

      if (!agentId) {
        throw new AppError('agentId is required for manual assignment', 400);
      }

      const result = await AssignmentService.manualAssignOrder(
        id,
        agentId as string,
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
      const id = req.params.id as string;
      const { rescheduledDate, timeSlot, remarks } = req.body;

      if (!rescheduledDate || !timeSlot) {
        throw new AppError('rescheduledDate and timeSlot are required', 400);
      }

      const result = await OrderService.rescheduleDelivery({
        orderId: id,
        rescheduledDate: rescheduledDate as string,
        timeSlot: timeSlot as string,
        remarks: remarks ? (remarks as string) : undefined,
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
