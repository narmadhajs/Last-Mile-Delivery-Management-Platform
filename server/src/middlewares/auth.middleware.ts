import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../db/prisma';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'AGENT' | 'CUSTOMER';
  agentId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authentication token required'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    
    // Fetch fresh user record
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { agentProfile: true }
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'User no longer exists' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      agentId: user.agentProfile?.id
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

export const requireRoles = (roles: Array<'ADMIN' | 'AGENT' | 'CUSTOMER'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access forbidden: requires one of [${roles.join(', ')}] role`
      });
      return;
    }

    next();
  };
};
