import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/my', NotificationController.getMyNotifications);
router.get('/all', requireRoles(['ADMIN']), NotificationController.getAllNotifications);
router.get('/audit-logs', requireRoles(['ADMIN']), NotificationController.getGlobalAuditLogs);

export default router;
