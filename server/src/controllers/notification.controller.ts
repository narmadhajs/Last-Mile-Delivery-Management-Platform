import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { TrackingService } from '../services/tracking.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class NotificationController {
  public static async getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) return res.json({ success: true, data: [] });

      const notifications = await NotificationService.getNotificationsForUser(user.id);
      res.json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  }

  public static async getAllNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await NotificationService.getAllNotifications(100);
      res.json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  }

  public static async getGlobalAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await TrackingService.getGlobalAuditLogs(100);
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}
