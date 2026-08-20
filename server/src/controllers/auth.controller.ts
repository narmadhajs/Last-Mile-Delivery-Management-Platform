import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { config } from '../config/env';
import { AppError } from '../middlewares/errorHandler.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AuthController {
  /**
   * Register a new customer or agent
   */
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, phone, role = 'CUSTOMER', companyName } = req.body;

      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        throw new AppError('Email already registered', 400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          phone,
          role: role as any,
          companyName,
          ...(role === 'AGENT' && {
            agentProfile: {
              create: {
                vehicleType: 'MOTORCYCLE',
                vehicleNumber: 'MH-01-AB-9999',
                status: 'AVAILABLE',
                currentLat: 19.0760,
                currentLng: 72.8777,
              },
            },
          }),
        },
        include: { agentProfile: true },
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            companyName: user.companyName,
            agentId: user.agentProfile?.id,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * User login
   */
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { agentProfile: true },
      });

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AppError('Invalid email or password', 401);
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            companyName: user.companyName,
            agentId: user.agentProfile?.id,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get current authenticated user profile
   */
  public static async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { agentProfile: { include: { homeZone: true } } },
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Demo Accounts List for quick one-click role switching & testing
   */
  public static async getDemoAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        take: 10,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          companyName: true,
          agentProfile: {
            select: {
              id: true,
              status: true,
              vehicleType: true,
              vehicleNumber: true,
              activeOrderCount: true,
              rating: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  }
}
