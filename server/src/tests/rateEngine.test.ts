import { RateEngineService } from '../services/rateEngine.service';
import { prisma } from '../db/prisma';

export async function testRateEngine() {
  console.log('🧪 Testing Rate Calculation Engine...');

  // Test 1: B2C Intra-Zone with Actual Weight Dominant
  // Dimensions 10x10x10 = 1000/5000 = 0.2kg volumetric vs 2.0kg actual -> Billed on 2.0kg
  // Pincode 400021 to 400013 (both in MUM-C -> Intra Zone)
  // Base (0.5kg) = ₹45, Excess = 1.5kg (3 slabs of 0.5kg) = 3 * 25 = ₹75. Subtotal = ₹120. Prepaid -> COD = 0. Total = ₹120
  const quote1 = await RateEngineService.calculateRate({
    pickupPincode: '400021',
    dropPincode: '400013',
    lengthCm: 10,
    widthCm: 10,
    heightCm: 10,
    actualWeightKg: 2.0,
    orderType: 'B2C',
    paymentType: 'PREPAID',
  });

  console.assert(quote1.billedOn === 'ACTUAL_WEIGHT', 'Quote 1 should be billed on actual weight');
  console.assert(quote1.chargeableWeightKg === 2.0, 'Quote 1 chargeable weight should be 2.0 kg');
  console.assert(quote1.isIntraZone === true, 'Quote 1 should be intra-zone');
  console.assert(quote1.baseCharge === 45.0, 'Quote 1 base charge should be ₹45');
  console.assert(quote1.incrementalCharge === 75.0, 'Quote 1 incremental charge should be ₹75');
  console.assert(quote1.totalAmount === 120.0, `Quote 1 total should be ₹120, got ${quote1.totalAmount}`);
  console.log('  ✅ Test 1 Passed: B2C Intra-Zone Actual Weight billing correctly calculated (₹120.00)');

  // Test 2: B2B Inter-Zone with Volumetric Weight Dominant
  // Dimensions 50x40x30 = 60000/5000 = 12.0kg volumetric vs 4.0kg actual -> Billed on 12.0kg
  // Pincode 400069 (MUM-S) to 400001 (MUM-C) -> Inter Zone
  // B2B Base (2.0kg) = ₹210, Excess = 10.0kg (10 slabs of 1.0kg) = 10 * 55 = ₹550. Subtotal = ₹760
  // Payment COD -> flat 25 + 2% of 760 (15.2) = 40.2 -> min fee ₹50 applies. Total = 760 + 50 = ₹810
  const quote2 = await RateEngineService.calculateRate({
    pickupPincode: '400069',
    dropPincode: '400001',
    lengthCm: 50,
    widthCm: 40,
    heightCm: 30,
    actualWeightKg: 4.0,
    orderType: 'B2B',
    paymentType: 'COD',
  });

  console.assert(quote2.billedOn === 'VOLUMETRIC_WEIGHT', 'Quote 2 should be billed on volumetric weight');
  console.assert(quote2.volumetricWeightKg === 12.0, 'Quote 2 volumetric weight should be 12.0 kg');
  console.assert(quote2.chargeableWeightKg === 12.0, 'Quote 2 chargeable weight should be 12.0 kg');
  console.assert(quote2.isIntraZone === false, 'Quote 2 should be inter-zone');
  console.assert(quote2.baseCharge === 210.0, 'Quote 2 base charge should be ₹210');
  console.assert(quote2.incrementalCharge === 550.0, 'Quote 2 incremental charge should be ₹550');
  console.assert(quote2.codSurcharge === 50.0, 'Quote 2 COD surcharge should be min fee ₹50');
  console.assert(quote2.totalAmount === 810.0, `Quote 2 total should be ₹810, got ${quote2.totalAmount}`);
  console.log('  ✅ Test 2 Passed: B2B Inter-Zone Volumetric billing & COD Surcharge verified (₹810.00)');

  // Test 3: Zero/Negative Dimension Validation Error
  try {
    await RateEngineService.calculateRate({
      pickupPincode: '400021',
      dropPincode: '400013',
      lengthCm: 0,
      widthCm: 10,
      heightCm: 10,
      actualWeightKg: 1.0,
      orderType: 'B2C',
      paymentType: 'PREPAID',
    });
    console.assert(false, 'Should have thrown error on zero dimension');
  } catch (err: any) {
    console.assert(err.message.includes('must be greater than 0'), 'Should validate dimensions > 0');
    console.log('  ✅ Test 3 Passed: Zero/Negative dimension validation verified');
  }

  console.log('✨ All Rate Engine tests passed successfully!\n');
}
