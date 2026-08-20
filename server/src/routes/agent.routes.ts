import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', AgentController.getAllAgents);
router.get('/:id', AgentController.getAgentById);
router.patch('/profile', requireRoles(['AGENT', 'ADMIN']), AgentController.updateStatusOrLocation);
router.patch('/:id/profile', requireRoles(['ADMIN']), AgentController.updateStatusOrLocation);

export default router;
