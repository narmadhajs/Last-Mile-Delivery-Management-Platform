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

      // Validate required pincode fields
      if (!pickupPincode || !dropPincode) {
        throw new AppError('Both pickupPincode and dropPincode are required', 400);
      }

      // Validate required dimension and weight fields
      if (lengthCm === undefined || widthCm === undefined || heightCm === undefined || actualWeightKg === undefined) {
        throw new AppError('lengthCm, widthCm, heightCm, and actualWeightKg are required', 400);
      }

      const quote = await RateEngineService.calculateRate({
        pickupPincode: String(pickupPincode),
        pickupArea: pickupArea ? String(pickupArea) : undefined,
        pickupLat: pickupLat !== undefined ? parseFloat(String(pickupLat)) : undefined,
        pickupLng: pickupLng !== undefined ? parseFloat(String(pickupLng)) : undefined,
        dropPincode: String(dropPincode),
        dropArea: dropArea ? String(dropArea) : undefined,
        dropLat: dropLat !== undefined ? parseFloat(String(dropLat)) : undefined,
        dropLng: dropLng !== undefined ? parseFloat(String(dropLng)) : undefined,
        lengthCm: parseFloat(String(lengthCm)),
        widthCm: parseFloat(String(widthCm)),
        heightCm: parseFloat(String(heightCm)),
        actualWeightKg: parseFloat(String(actualWeightKg)),
        orderType: (orderType as string) as 'B2C' | 'B2B',
        paymentType: (paymentType as string) as 'PREPAID' | 'COD',
        declaredValue: declaredValue !== undefined ? parseFloat(String(declaredValue)) : undefined,
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
          code: String(data.code).toUpperCase(),
          name: String(data.name),
          orderType: data.orderType,
          baseWeightKg: parseFloat(String(data.baseWeightKg)),
          baseRateIntra: parseFloat(String(data.baseRateIntra)),
          baseRateInter: parseFloat(String(data.baseRateInter)),
          incrementalWeightKg: parseFloat(String(data.incrementalWeightKg)),
          incrementalRateIntra: parseFloat(String(data.incrementalRateIntra)),
          incrementalRateInter: parseFloat(String(data.incrementalRateInter)),
          volumetricDivisor: parseFloat(String(data.volumetricDivisor || '5000')),
          codFlatFee: parseFloat(String(data.codFlatFee || '0')),
          codPercentage: parseFloat(String(data.codPercentage || '0')),
          codMinFee: parseFloat(String(data.codMinFee || '0')),
          isActive: data.isActive ?? true,
          notes: data.notes ? String(data.notes) : undefined,
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
      const id = req.params.id as string;
      const data = req.body;

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = String(data.name);
      if (data.orderType !== undefined) updateData.orderType = data.orderType;
      if (data.baseWeightKg !== undefined) updateData.baseWeightKg = parseFloat(String(data.baseWeightKg));
      if (data.baseRateIntra !== undefined) updateData.baseRateIntra = parseFloat(String(data.baseRateIntra));
      if (data.baseRateInter !== undefined) updateData.baseRateInter = parseFloat(String(data.baseRateInter));
      if (data.incrementalWeightKg !== undefined) updateData.incrementalWeightKg = parseFloat(String(data.incrementalWeightKg));
      if (data.incrementalRateIntra !== undefined) updateData.incrementalRateIntra = parseFloat(String(data.incrementalRateIntra));
      if (data.incrementalRateInter !== undefined) updateData.incrementalRateInter = parseFloat(String(data.incrementalRateInter));
      if (data.volumetricDivisor !== undefined) updateData.volumetricDivisor = parseFloat(String(data.volumetricDivisor));
      if (data.codFlatFee !== undefined) updateData.codFlatFee = parseFloat(String(data.codFlatFee));
      if (data.codPercentage !== undefined) updateData.codPercentage = parseFloat(String(data.codPercentage));
      if (data.codMinFee !== undefined) updateData.codMinFee = parseFloat(String(data.codMinFee));
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.notes !== undefined) updateData.notes = String(data.notes);

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
      const id = req.params.id as string;
      await prisma.rateCard.delete({ where: { id } });
      res.json({ success: true, message: 'Rate card deleted' });
    } catch (err) {
      next(err);
    }
  }
}
