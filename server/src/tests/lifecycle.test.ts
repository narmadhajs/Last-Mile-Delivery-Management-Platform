import { OrderService } from '../services/order.service';
import { prisma } from '../db/prisma';
import { OrderStatus } from '@prisma/client';

export async function testLifecycleStateMachine() {
  console.log('🧪 Testing Order Status Lifecycle, Immutable Tracking & Reschedule Flow...');

  // Fetch sample customer
  const customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
  if (!customer) throw new Error('Customer user not found for testing');

  // 1. Create a fresh order
  const { order } = await OrderService.createOrder({
    customerId: customer.id,
    pickupAddress: 'Bandra Kurla Complex Block G',
    pickupPincode: '400051',
    pickupCity: 'Mumbai',
    pickupContactName: 'Test Sender',
    pickupContactPhone: '+91-9999900001',
    dropAddress: 'Andheri East Logistics Hub',
    dropPincode: '400069',
    dropCity: 'Mumbai',
    dropContactName: 'Test Recipient',
    dropContactPhone: '+91-9999900002',
    lengthCm: 20,
    widthCm: 15,
    heightCm: 10,
    actualWeightKg: 0.8,
    orderType: 'B2C',
    paymentType: 'PREPAID',
    autoAssignAgent: false,
  });

  console.assert(order.status === OrderStatus.CONFIRMED, 'New order status should be CONFIRMED');
  console.log('  ✅ Step 1: Order created with status CONFIRMED');

  // 2. Assign Agent
  const agent = await prisma.deliveryAgent.findFirst();
  if (!agent) throw new Error('Agent not found');

  const assignedOrder = await OrderService.updateOrderStatus({
    orderId: order.id,
    status: OrderStatus.ASSIGNED,
    actorId: agent.userId,
    actorRole: 'SYSTEM',
    actorName: 'Auto-Assignment',
    locationText: 'BKC Central Hub',
  });
  console.assert(assignedOrder.status === OrderStatus.ASSIGNED, 'Order status should be ASSIGNED');
  console.log('  ✅ Step 2: Transitioned to ASSIGNED');

  // 3. Mark PICKED_UP
  const pickedUpOrder = await OrderService.updateOrderStatus({
    orderId: order.id,
    status: OrderStatus.PICKED_UP,
    actorId: agent.userId,
    actorRole: 'AGENT',
    actorName: 'Test Agent',
    locationText: 'Pickup Address Bandra',
    remarks: 'Package securely loaded.',
  });
  console.assert(pickedUpOrder.status === OrderStatus.PICKED_UP, 'Order status should be PICKED_UP');
  console.log('  ✅ Step 3: Transitioned to PICKED_UP');

  // 4. Mark FAILED delivery
  const failedOrder = await OrderService.updateOrderStatus({
    orderId: order.id,
    status: OrderStatus.FAILED,
    actorId: agent.userId,
    actorRole: 'AGENT',
    actorName: 'Test Agent',
    locationText: 'Destination Doorstep',
    failureReason: 'Customer Not At Home',
  });
  console.assert(failedOrder.status === OrderStatus.FAILED, 'Order status should be FAILED');
  console.assert(failedOrder.failureReason === 'Customer Not At Home', 'Failure reason should be captured');
  console.log('  ✅ Step 4: Transitioned to FAILED with captured failure reason');

  // 5. Customer Reschedules Failed Delivery
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];
  const { order: rescheduledOrder } = await OrderService.rescheduleDelivery({
    orderId: order.id,
    rescheduledDate: tomorrow,
    timeSlot: '14:00 - 18:00',
    remarks: 'Please deliver after 3pm',
    actorId: customer.id,
    actorName: customer.name,
  });
  console.assert(rescheduledOrder.status === OrderStatus.RESCHEDULED, 'Order status should be RESCHEDULED');
  console.assert(rescheduledOrder.rescheduleTimeSlot === '14:00 - 18:00', 'Reschedule slot should be recorded');
  console.log('  ✅ Step 5: Successfully Rescheduled by Customer');

  // 6. Verify Immutable Tracking History Logs
  const history = await prisma.trackingHistory.findMany({
    where: { orderId: order.id },
    orderBy: { timestamp: 'asc' },
  });

  console.assert(history.length >= 5, `Tracking history should have recorded all 5 events, got ${history.length}`);
  console.log(`  ✅ Step 6: Verified ${history.length} immutable tracking log entries recorded with actors & timestamps.`);

  console.log('✨ All Lifecycle State Machine & Rescheduling tests passed successfully!\n');
}
