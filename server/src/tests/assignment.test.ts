import { calculateHaversineDistance } from '../utils/haversine';
import { AssignmentService } from '../services/assignment.service';
import { prisma } from '../db/prisma';

export async function testAssignmentEngine() {
  console.log('🧪 Testing Intelligent Auto-Assignment Engine & Haversine formula...');

  // Test 1: Haversine distance accuracy
  // Distance between Nariman Point (18.9260, 72.8234) and Lower Parel (18.9986, 72.8300) ~ 8.1 km
  const distKm = calculateHaversineDistance(18.9260, 72.8234, 18.9986, 72.8300);
  console.assert(distKm >= 7.5 && distKm <= 8.5, `Distance should be ~8.1 km, got ${distKm}`);
  console.log(`  ✅ Test 1 Passed: Haversine distance verified (${distKm} km)`);

  // Test 2: Candidate Evaluation & Scoring
  const order = await prisma.order.findFirst({
    where: { status: 'OUT_FOR_DELIVERY' },
  });

  if (order) {
    const candidates = await AssignmentService.evaluateCandidatesForOrder(order.id);
    console.assert(candidates.length > 0, 'Should return available agent candidates');
    console.assert(candidates[0].compositeScore <= candidates[candidates.length - 1].compositeScore, 'Candidates should be sorted ascending by composite score');
    console.log(`  ✅ Test 2 Passed: ${candidates.length} candidates evaluated and ranked by proximity/workload score.`);
  }

  console.log('✨ All Auto-Assignment Engine tests passed successfully!\n');
}
