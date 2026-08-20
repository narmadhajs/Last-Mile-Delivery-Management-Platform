import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler.middleware';
import { AgentStatus } from '@prisma/client';

export class AgentController {
  /**
   * List all delivery agents
   */
  public static async getAllAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, zoneId } = req.query;

      const whereClause: any = {};
      if (status) whereClause.status = status as AgentStatus;
      if (zoneId) whereClause.homeZoneId = zoneId as string;

      const agents = await prisma.deliveryAgent.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          homeZone: true,
          assignedOrders: {
            where: { status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } },
            select: { id: true, trackingNumber: true, status: true, dropAddress: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: agents,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get agent by ID
   */
  public static async getAgentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const agent = await prisma.deliveryAgent.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          homeZone: true,
          assignedOrders: {
            include: {
              customer: { select: { name: true, phone: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!agent) throw new AppError('Agent not found', 404);

      res.json({
        success: true,
        data: agent,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Agent updates their own status / coordinates
   */
  public static async updateStatusOrLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      const { status, currentLat, currentLng, vehicleType, vehicleNumber, homeZoneId } = req.body;

      let agentId = user?.agentId;
      if (user?.role === 'ADMIN' && req.params.id) {
        agentId = req.params.id;
      }

      if (!agentId) {
        throw new AppError('Agent profile not found for user', 404);
      }

      const updateData: any = {
        lastLocationUpdate: new Date(),
      };

      if (status) updateData.status = status as AgentStatus;
      if (currentLat !== undefined) updateData.currentLat = parseFloat(currentLat);
      if (currentLng !== undefined) updateData.currentLng = parseFloat(currentLng);
      if (vehicleType) updateData.vehicleType = vehicleType;
      if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;
      if (homeZoneId !== undefined) updateData.homeZoneId = homeZoneId;

      const agent = await prisma.deliveryAgent.update({
        where: { id: agentId },
        data: updateData,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          homeZone: true,
        },
      });

      res.json({
        success: true,
        data: agent,
      });
    } catch (err) {
      next(err);
    }
  }
}
