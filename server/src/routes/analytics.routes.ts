import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);
router.get('/dashboard', AnalyticsController.getDashboardStats);

export default router;

