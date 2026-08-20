import { connectDB, prisma } from '../db/prisma';
import { testRateEngine } from './rateEngine.test';
import { testAssignmentEngine } from './assignment.test';
import { testLifecycleStateMachine } from './lifecycle.test';

async function runAll() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING LAST-MILE DELIVERY SYSTEM TEST SUITE');
  console.log('======================================================\n');

  await connectDB();

  try {
    await testRateEngine();
    await testAssignmentEngine();
    await testLifecycleStateMachine();

    console.log('======================================================');
    console.log('🎉 ALL BACKEND UNIT & INTEGRATION TESTS PASSED (100%)');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAll();
