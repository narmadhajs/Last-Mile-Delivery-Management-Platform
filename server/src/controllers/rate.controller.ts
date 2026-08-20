import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';
import { RateEngineService } from '../services/rateEngine.service';
import { AppError } from '../middlewares/errorHandler.middleware';

export class RateController {
  /**
   * Calculate live shipping estimate / quote
   */
  public static async calculateQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        pickupPincode,
        pickupArea,
        pickupLat,
        pickupLng,
        dropPincode,
        dropArea,
        dropLat,
        dropLng,
        lengthCm,
        widthCm,
        heightCm,
        actualWeightKg,
        orderType = 'B2C',
        paymentType = 'PREPAID',
        declaredValue,
      } = req.body;

      const quote = await RateEngineService.calculateRate({
        pickupPincode,
        pickupArea,
        pickupLat: pickupLat ? parseFloat(pickupLat) : undefined,
        pickupLng: pickupLng ? parseFloat(pickupLng) : undefined,
        dropPincode,
        dropArea,
        dropLat: dropLat ? parseFloat(dropLat) : undefined,
        dropLng: dropLng ? parseFloat(dropLng) : undefined,
        lengthCm: parseFloat(lengthCm),
        widthCm: parseFloat(widthCm),
        heightCm: parseFloat(heightCm),
        actualWeightKg: parseFloat(actualWeightKg),
        orderType,
        paymentType,
        declaredValue: declaredValue ? parseFloat(declaredValue) : undefined,
      });

      res.json({
        success: true,
        data: quote,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all configured rate cards
   */
  public static async getRateCards(req: Request, res: Response, next: NextFunction) {
    try {
      const rateCards = await prisma.rateCard.findMany({
        orderBy: [{ isActive: 'desc' }, { orderType: 'asc' }],
      });

      res.json({
        success: true,
        data: rateCards,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new Rate Card (Admin)
   */
  public static async createRateCard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const rateCard = await prisma.rateCard.create({
        data: {
          code: data.code.toUpperCase(),
          name: data.name,
          orderType: data.orderType,
          baseWeightKg: parseFloat(data.baseWeightKg),
          baseRateIntra: parseFloat(data.baseRateIntra),
          baseRateInter: parseFloat(data.baseRateInter),
          incrementalWeightKg: parseFloat(data.incrementalWeightKg),
          incrementalRateIntra: parseFloat(data.incrementalRateIntra),
          incrementalRateInter: parseFloat(data.incrementalRateInter),
          volumetricDivisor: parseFloat(data.volumetricDivisor || '5000'),
          codFlatFee: parseFloat(data.codFlatFee || '0'),
          codPercentage: parseFloat(data.codPercentage || '0'),
          codMinFee: parseFloat(data.codMinFee || '0'),
          isActive: data.isActive ?? true,
          notes: data.notes,
        },
      });

      res.status(201).json({
        success: true,
        data: rateCard,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update Rate Card configuration (Admin)
   */
  public static async updateRateCard(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = req.body;

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.orderType !== undefined) updateData.orderType = data.orderType;
      if (data.baseWeightKg !== undefined) updateData.baseWeightKg = parseFloat(data.baseWeightKg);
      if (data.baseRateIntra !== undefined) updateData.baseRateIntra = parseFloat(data.baseRateIntra);
      if (data.baseRateInter !== undefined) updateData.baseRateInter = parseFloat(data.baseRateInter);
      if (data.incrementalWeightKg !== undefined) updateData.incrementalWeightKg = parseFloat(data.incrementalWeightKg);
      if (data.incrementalRateIntra !== undefined) updateData.incrementalRateIntra = parseFloat(data.incrementalRateIntra);
      if (data.incrementalRateInter !== undefined) updateData.incrementalRateInter = parseFloat(data.incrementalRateInter);
      if (data.volumetricDivisor !== undefined) updateData.volumetricDivisor = parseFloat(data.volumetricDivisor);
      if (data.codFlatFee !== undefined) updateData.codFlatFee = parseFloat(data.codFlatFee);
      if (data.codPercentage !== undefined) updateData.codPercentage = parseFloat(data.codPercentage);
      if (data.codMinFee !== undefined) updateData.codMinFee = parseFloat(data.codMinFee);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const rateCard = await prisma.rateCard.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        data: rateCard,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a Rate Card (Admin)
   */
  public static async deleteRateCard(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.rateCard.delete({ where: { id } });
      res.json({ success: true, message: 'Rate card deleted' });
    } catch (err) {
      next(err);
    }
  }
}
