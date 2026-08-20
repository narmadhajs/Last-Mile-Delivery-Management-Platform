import { prisma } from '../db/prisma';
import { calculateHaversineDistance } from '../utils/haversine';
import { AppError } from '../middlewares/errorHandler.middleware';

export interface RateCalculationInput {
  pickupPincode: string;
  pickupArea?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropPincode: string;
  dropArea?: string;
  dropLat?: number;
  dropLng?: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  orderType: 'B2C' | 'B2B';
  paymentType: 'PREPAID' | 'COD';
  declaredValue?: number;
}

export interface RateCalculationResult {
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  billedOn: 'ACTUAL_WEIGHT' | 'VOLUMETRIC_WEIGHT';
  volumetricDivisor: number;
  pickupZone: {
    id: string;
    code: string;
    name: string;
    city: string;
  };
  dropZone: {
    id: string;
    code: string;
    name: string;
    city: string;
  };
  isIntraZone: boolean;
  rateCard: {
    id: string;
    code: string;
    name: string;
    orderType: string;
    baseWeightKg: number;
    baseRate: number;
    incrementalWeightKg: number;
    incrementalRate: number;
  };
  baseCharge: number;
  excessWeightKg: number;
  incrementalSlabs: number;
  incrementalCharge: number;
  subtotal: number;
  codSurcharge: number;
  totalAmount: number;
  explanation: {
    volumetricFormula: string;
    weightDetermination: string;
    zoneDetermination: string;
    rateFormula: string;
    codFormula: string;
  };
}

export class RateEngineService {
  /**
   * Detects the zone for a given pincode, area, or coordinates
   */
  public static async detectZone(
    pincode: string,
    areaName?: string,
    lat?: number,
    lng?: number
  ) {
    const cleanPincode = pincode.trim();

    // 1. Exact match on ZoneArea pincode
    const areaByPincode = await prisma.zoneArea.findFirst({
      where: { pincode: cleanPincode },
      include: { zone: true },
    });

    if (areaByPincode?.zone && areaByPincode.zone.isActive) {
      return areaByPincode.zone;
    }

    // 2. Partial/text match on Area Name
    if (areaName) {
      const areaByName = await prisma.zoneArea.findFirst({
        where: {
          areaName: { contains: areaName.trim() },
        },
        include: { zone: true },
      });

      if (areaByName?.zone && areaByName.zone.isActive) {
        return areaByName.zone;
      }
    }

    // 3. Coordinate proximity matching to zone centers
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      const allZones = await prisma.zone.findMany({ where: { isActive: true } });
      let closestZone = null;
      let minDistance = Infinity;

      for (const zone of allZones) {
        const dist = calculateHaversineDistance(lat, lng, zone.centerLat, zone.centerLng);
        if (dist <= zone.radiusKm && dist < minDistance) {
          minDistance = dist;
          closestZone = zone;
        }
      }

      if (closestZone) {
        return closestZone;
      }
    }

    // 4. Prefix match on first 3 digits of Pincode (e.g. 400xxx -> Mumbai, 560xxx -> Bangalore, 110xxx -> Delhi)
    const prefix = cleanPincode.substring(0, 3);
    const areaByPrefix = await prisma.zoneArea.findFirst({
      where: { pincode: { startsWith: prefix } },
      include: { zone: true },
    });

    if (areaByPrefix?.zone && areaByPrefix.zone.isActive) {
      return areaByPrefix.zone;
    }

    // 5. Fallback to first active zone in database
    const fallbackZone = await prisma.zone.findFirst({
      where: { isActive: true },
    });

    if (!fallbackZone) {
      throw new AppError('No operational delivery zones configured in the system', 500);
    }

    return fallbackZone;
  }

  /**
   * Main calculation engine
   */
  public static async calculateRate(
    input: RateCalculationInput
  ): Promise<RateCalculationResult> {
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
      orderType,
      paymentType,
    } = input;

    // Validate physical dimensions
    if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
      throw new AppError('Package dimensions (Length, Width, Height) must be greater than 0');
    }
    if (actualWeightKg <= 0) {
      throw new AppError('Package actual weight must be greater than 0 kg');
    }

    // 1. Fetch active Rate Card for the requested OrderType (B2C or B2B)
    const rateCard = await prisma.rateCard.findFirst({
      where: {
        orderType,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!rateCard) {
      throw new AppError(`No active rate card configured for order type: ${orderType}`, 500);
    }

    // 2. Calculate Volumetric Weight
    const divisor = rateCard.volumetricDivisor || 5000;
    const rawVolumetricWeight = (lengthCm * widthCm * heightCm) / divisor;
    const volumetricWeightKg = Math.round(rawVolumetricWeight * 100) / 100;
    const sanitizedActualWeight = Math.round(actualWeightKg * 100) / 100;

    // 3. Determine Chargeable Weight (Higher of Actual vs Volumetric)
    const chargeableWeightKg = Math.max(sanitizedActualWeight, volumetricWeightKg);
    const billedOn =
      volumetricWeightKg > sanitizedActualWeight ? 'VOLUMETRIC_WEIGHT' : 'ACTUAL_WEIGHT';

    // 4. Zone Detection
    const pickupZone = await this.detectZone(pickupPincode, pickupArea, pickupLat, pickupLng);
    const dropZone = await this.detectZone(dropPincode, dropArea, dropLat, dropLng);
    const isIntraZone = pickupZone.id === dropZone.id;

    // 5. Select Base Rate & Incremental Rate based on Intra vs Inter Zone
    const baseRate = isIntraZone ? rateCard.baseRateIntra : rateCard.baseRateInter;
    const incrementalRate = isIntraZone
      ? rateCard.incrementalRateIntra
      : rateCard.incrementalRateInter;

    // 6. Base Charge & Incremental Charges
    const baseCharge = baseRate;
    const baseWeightKg = rateCard.baseWeightKg;
    const incrementalWeightKg = rateCard.incrementalWeightKg;

    const excessWeightKg = Math.max(0, chargeableWeightKg - baseWeightKg);
    const incrementalSlabs =
      excessWeightKg > 0 ? Math.ceil(excessWeightKg / incrementalWeightKg) : 0;
    const incrementalCharge = Math.round(incrementalSlabs * incrementalRate * 100) / 100;

    const subtotal = Math.round((baseCharge + incrementalCharge) * 100) / 100;

    // 7. COD Surcharge Calculation
    let codSurcharge = 0;
    if (paymentType === 'COD') {
      const percentageFee = (subtotal * rateCard.codPercentage) / 100;
      const totalCodCalculated = rateCard.codFlatFee + percentageFee;
      codSurcharge = Math.round(Math.max(rateCard.codMinFee, totalCodCalculated) * 100) / 100;
    }

    const totalAmount = Math.round((subtotal + codSurcharge) * 100) / 100;

    // 8. Human-friendly explanations for audit and transparent customer UI
    const explanation = {
      volumetricFormula: `(${lengthCm} × ${widthCm} × ${heightCm}) ÷ ${divisor} = ${volumetricWeightKg} kg`,
      weightDetermination:
        billedOn === 'VOLUMETRIC_WEIGHT'
          ? `Volumetric weight (${volumetricWeightKg} kg) exceeds actual weight (${sanitizedActualWeight} kg). Billed on ${volumetricWeightKg} kg.`
          : `Actual weight (${sanitizedActualWeight} kg) exceeds volumetric weight (${volumetricWeightKg} kg). Billed on ${sanitizedActualWeight} kg.`,
      zoneDetermination: isIntraZone
        ? `Intra-Zone Delivery: Both origin (${pickupZone.name}) and destination (${dropZone.name}) are within Zone ${pickupZone.code}.`
        : `Inter-Zone Delivery: Origin is ${pickupZone.name} (${pickupZone.code}) and destination is ${dropZone.name} (${dropZone.code}).`,
      rateFormula: `Base (up to ${baseWeightKg}kg): ₹${baseRate} + Incremental (${incrementalSlabs} slab(s) × ₹${incrementalRate}): ₹${incrementalCharge} = Subtotal: ₹${subtotal}`,
      codFormula:
        paymentType === 'COD'
          ? `COD Surcharge: max(₹${rateCard.codMinFee}, ₹${rateCard.codFlatFee} flat + ${rateCard.codPercentage}% of ₹${subtotal}) = ₹${codSurcharge}`
          : `Prepaid Order: No COD surcharge applicable (₹0.00).`,
    };

    return {
      actualWeightKg: sanitizedActualWeight,
      volumetricWeightKg,
      chargeableWeightKg,
      billedOn,
      volumetricDivisor: divisor,
      pickupZone: {
        id: pickupZone.id,
        code: pickupZone.code,
        name: pickupZone.name,
        city: pickupZone.city,
      },
      dropZone: {
        id: dropZone.id,
        code: dropZone.code,
        name: dropZone.name,
        city: dropZone.city,
      },
      isIntraZone,
      rateCard: {
        id: rateCard.id,
        code: rateCard.code,
        name: rateCard.name,
        orderType: rateCard.orderType,
        baseWeightKg,
        baseRate,
        incrementalWeightKg,
        incrementalRate,
      },
      baseCharge,
      excessWeightKg: Math.round(excessWeightKg * 100) / 100,
      incrementalSlabs,
      incrementalCharge,
      subtotal,
      codSurcharge,
      totalAmount,
      explanation,
    };
  }
}
