import { Router } from 'express';
import { ZoneController } from '../controllers/zone.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', ZoneController.getAllZones);
router.get('/lookup/:pincode', ZoneController.lookupPincode);
router.get('/:id', ZoneController.getZoneById);
router.post('/', authenticateJWT, requireRoles(['ADMIN']), ZoneController.createZone);
router.put('/:id', authenticateJWT, requireRoles(['ADMIN']), ZoneController.updateZone);
router.post('/:zoneId/areas', authenticateJWT, requireRoles(['ADMIN']), ZoneController.addArea);
router.delete('/areas/:areaId', authenticateJWT, requireRoles(['ADMIN']), ZoneController.removeArea);

export default router;
