import { Router } from 'express';
import { RateController } from '../controllers/rate.controller';
import { authenticateJWT, requireRoles } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

const quoteSchema = z.object({
  body: z.object({
    pickupPincode: z.string().min(3),
    pickupArea: z.string().optional(),
    pickupLat: z.number().or(z.string()).optional(),
    pickupLng: z.number().or(z.string()).optional(),
    dropPincode: z.string().min(3),
    dropArea: z.string().optional(),
    dropLat: z.number().or(z.string()).optional(),
    dropLng: z.number().or(z.string()).optional(),
    lengthCm: z.number().or(z.string()),
    widthCm: z.number().or(z.string()),
    heightCm: z.number().or(z.string()),
    actualWeightKg: z.number().or(z.string()),
    orderType: z.enum(['B2C', 'B2B']).default('B2C'),
    paymentType: z.enum(['PREPAID', 'COD']).default('PREPAID'),
    declaredValue: z.number().or(z.string()).optional(),
  }),
});

router.post('/calculate', validate(quoteSchema), RateController.calculateQuote);
router.get('/cards', RateController.getRateCards);
router.post('/cards', authenticateJWT, requireRoles(['ADMIN']), RateController.createRateCard);
router.put('/cards/:id', authenticateJWT, requireRoles(['ADMIN']), RateController.updateRateCard);
router.delete('/cards/:id', authenticateJWT, requireRoles(['ADMIN']), RateController.deleteRateCard);

export default router;
