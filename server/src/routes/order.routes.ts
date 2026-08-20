import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

// Public / Authenticated track
router.get('/track/:id', OrderController.getOrderById);

// Authenticated order management
router.use(authenticateJWT);

router.post('/', OrderController.createOrder);
router.get('/', OrderController.getOrders);
router.get('/:id', OrderController.getOrderById);
router.get('/:id/candidates', OrderController.getCandidates);

// Status updates by Agents / Admins
router.patch('/:id/status', requireRoles(['AGENT', 'ADMIN']), OrderController.updateStatus);

// Reschedule by Customer or Admin
router.post('/:id/reschedule', requireRoles(['CUSTOMER', 'ADMIN']), OrderController.reschedule);

// Admin controls
router.post('/:id/auto-assign', requireRoles(['ADMIN']), OrderController.autoAssign);
router.post('/:id/assign', requireRoles(['ADMIN']), OrderController.manualAssign);
router.patch('/:id/admin-override', requireRoles(['ADMIN']), OrderController.adminOverrideStatus);

export default router;
