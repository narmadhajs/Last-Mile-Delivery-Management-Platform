import { Router } from 'express';
import authRoutes from './auth.routes';
import rateRoutes from './rate.routes';
import zoneRoutes from './zone.routes';
import orderRoutes from './order.routes';
import agentRoutes from './agent.routes';
import analyticsRoutes from './analytics.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/rates', rateRoutes);
router.use('/zones', zoneRoutes);
router.use('/orders', orderRoutes);
router.use('/agents', agentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Last-Mile Delivery Tracker API',
    version: '1.0.0',
  });
});

export default router;
