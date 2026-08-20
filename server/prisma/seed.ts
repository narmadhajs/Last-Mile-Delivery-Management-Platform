import { PrismaClient, Role, AgentStatus, OrderType, PaymentType, PaymentStatus, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with realistic logistics network data...');

  // 1. Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.trackingHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.zoneArea.deleteMany();
  await prisma.deliveryAgent.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Standard Rate Cards
  console.log('📦 Creating B2C and B2B Rate Cards...');
  const rateCardB2C = await prisma.rateCard.create({
    data: {
      code: 'RATE-B2C-STD',
      name: 'Standard B2C Retail Delivery Rate Card',
      orderType: OrderType.B2C,
      baseWeightKg: 0.5,
      baseRateIntra: 45.0,
      baseRateInter: 75.0,
      incrementalWeightKg: 0.5,
      incrementalRateIntra: 25.0,
      incrementalRateInter: 45.0,
      volumetricDivisor: 5000.0,
      codFlatFee: 15.0,
      codPercentage: 1.5,
      codMinFee: 30.0,
      isActive: true,
      notes: 'Standard consumer ecommerce delivery rate card with 5000 volumetric factor.',
    },
  });

  const rateCardB2B = await prisma.rateCard.create({
    data: {
      code: 'RATE-B2B-EXP',
      name: 'B2B Enterprise Commercial Freight Card',
      orderType: OrderType.B2B,
      baseWeightKg: 2.0,
      baseRateIntra: 120.0,
      baseRateInter: 210.0,
      incrementalWeightKg: 1.0,
      incrementalRateIntra: 30.0,
      incrementalRateInter: 55.0,
      volumetricDivisor: 5000.0,
      codFlatFee: 25.0,
      codPercentage: 2.0,
      codMinFee: 50.0,
      isActive: true,
      notes: 'Commercial B2B heavy parcel shipping rate card for enterprise clients.',
    },
  });

  // 3. Create Metro Logistics Zones & Pincode Mappings
  console.log('🏙️ Creating Metro Logistics Zones & Pincode Areas...');
  const zoneMumC = await prisma.zone.create({
    data: {
      code: 'MUM-C',
      name: 'Mumbai Central & South Zone',
      description: 'South Mumbai commercial district, Nariman Point, Lower Parel & Dadar',
      city: 'Mumbai',
      state: 'Maharashtra',
      centerLat: 18.9750,
      centerLng: 72.8258,
      radiusKm: 12.0,
      areas: {
        create: [
          { areaName: 'Nariman Point & Marine Drive', pincode: '400021', city: 'Mumbai', lat: 18.9260, lng: 72.8234 },
          { areaName: 'Fort & Colaba Financial Center', pincode: '400001', city: 'Mumbai', lat: 18.9322, lng: 72.8347 },
          { areaName: 'Lower Parel High Street Hub', pincode: '400013', city: 'Mumbai', lat: 18.9986, lng: 72.8300 },
          { areaName: 'Worli Sea Face & Commercials', pincode: '400018', city: 'Mumbai', lat: 19.0166, lng: 72.8166 },
          { areaName: 'Dadar Central Junction', pincode: '400014', city: 'Mumbai', lat: 19.0178, lng: 72.8478 },
        ],
      },
    },
  });

  const zoneMumS = await prisma.zone.create({
    data: {
      code: 'MUM-S',
      name: 'Mumbai Suburbs & Airport Zone',
      description: 'Bandra BKC, Andheri Cargo Terminal, Powai Tech Park & Santacruz',
      city: 'Mumbai',
      state: 'Maharashtra',
      centerLat: 19.0760,
      centerLng: 72.8777,
      radiusKm: 18.0,
      areas: {
        create: [
          { areaName: 'Bandra Kurla Complex (BKC)', pincode: '400051', city: 'Mumbai', lat: 19.0663, lng: 72.8687 },
          { areaName: 'Andheri East Logistics Hub', pincode: '400069', city: 'Mumbai', lat: 19.1197, lng: 72.8464 },
          { areaName: 'Powai Silicon Valley', pincode: '400076', city: 'Mumbai', lat: 19.1176, lng: 72.9060 },
          { areaName: 'Santacruz Cargo Terminal', pincode: '400054', city: 'Mumbai', lat: 19.0843, lng: 72.8360 },
          { areaName: 'Goregaon West IT Hub', pincode: '400062', city: 'Mumbai', lat: 19.1551, lng: 72.8491 },
        ],
      },
    },
  });

  const zoneBlr = await prisma.zone.create({
    data: {
      code: 'BLR-C',
      name: 'Bangalore Central & Tech Corridors',
      description: 'Koramangala, Indiranagar, Whitefield, and Electronic City',
      city: 'Bangalore',
      state: 'Karnataka',
      centerLat: 12.9716,
      centerLng: 77.5946,
      radiusKm: 20.0,
      areas: {
        create: [
          { areaName: 'Koramangala Startup Hub', pincode: '560034', city: 'Bangalore', lat: 12.9352, lng: 77.6245 },
          { areaName: 'Indiranagar 100 Feet Rd', pincode: '560038', city: 'Bangalore', lat: 12.9784, lng: 77.6408 },
          { areaName: 'Whitefield IT Export Zone', pincode: '560066', city: 'Bangalore', lat: 12.9698, lng: 77.7499 },
          { areaName: 'MG Road Metro Central', pincode: '560001', city: 'Bangalore', lat: 12.9756, lng: 77.6066 },
        ],
      },
    },
  });

  const zoneDel = await prisma.zone.create({
    data: {
      code: 'DEL-NCR',
      name: 'Delhi NCR Logistics Gateway',
      description: 'Connaught Place, Gurgaon Cyber City, and Noida Express Zone',
      city: 'Delhi',
      state: 'Delhi',
      centerLat: 28.6139,
      centerLng: 77.2090,
      radiusKm: 25.0,
      areas: {
        create: [
          { areaName: 'Connaught Place Core', pincode: '110001', city: 'Delhi', lat: 28.6315, lng: 77.2167 },
          { areaName: 'Gurgaon Cyber City Hub', pincode: '122002', city: 'Gurgaon', lat: 28.4906, lng: 77.0898 },
          { areaName: 'Noida Sector 62 IT Park', pincode: '201301', city: 'Noida', lat: 28.6258, lng: 77.3688 },
        ],
      },
    },
  });

  // 4. Create Users (Admins, Customers, Agents)
  console.log('👤 Creating Users and Delivery Agent Fleet...');
  const defaultPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@delivery.com',
      password: adminPassword,
      name: 'Siddharth Varma (Fleet Director)',
      phone: '+91-9820011223',
      role: Role.ADMIN,
      companyName: 'LogiTrack Central Operations',
    },
  });

  // Customers
  const customerJohn = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password: defaultPassword,
      name: 'John Fernandes',
      phone: '+91-9876543210',
      role: Role.CUSTOMER,
      companyName: 'Individual Consumer',
    },
  });

  const customerSarahB2B = await prisma.user.create({
    data: {
      email: 'sarah.b2b@apexlogistics.com',
      password: defaultPassword,
      name: 'Sarah Jenkins',
      phone: '+91-9988776655',
      role: Role.CUSTOMER,
      companyName: 'Apex Electronics Global Pvt Ltd',
    },
  });

  const customerAnita = await prisma.user.create({
    data: {
      email: 'anita.sharma@gmail.com',
      password: defaultPassword,
      name: 'Anita Sharma',
      phone: '+91-9123456789',
      role: Role.CUSTOMER,
      companyName: 'Studio Anita Decor',
    },
  });

  // Delivery Agents with GPS coordinates
  const agentUser1 = await prisma.user.create({
    data: {
      email: 'rajesh.agent@delivery.com',
      password: defaultPassword,
      name: 'Rajesh Kumar',
      phone: '+91-9811223344',
      role: Role.AGENT,
    },
  });
  const agentProfile1 = await prisma.deliveryAgent.create({
    data: {
      userId: agentUser1.id,
      vehicleType: 'MOTORCYCLE',
      vehicleNumber: 'MH-01-BK-1080',
      status: AgentStatus.AVAILABLE,
      currentLat: 19.0663, // BKC
      currentLng: 72.8687,
      homeZoneId: zoneMumS.id,
      rating: 4.92,
      totalDeliveries: 142,
      activeOrderCount: 0,
      maxCapacity: 5,
    },
  });

  const agentUser2 = await prisma.user.create({
    data: {
      email: 'amit.agent@delivery.com',
      password: defaultPassword,
      name: 'Amit Patel',
      phone: '+91-9833445566',
      role: Role.AGENT,
    },
  });
  const agentProfile2 = await prisma.deliveryAgent.create({
    data: {
      userId: agentUser2.id,
      vehicleType: 'EV_SCOOTER',
      vehicleNumber: 'MH-02-EV-7722',
      status: AgentStatus.AVAILABLE,
      currentLat: 18.9986, // Lower Parel
      currentLng: 72.8300,
      homeZoneId: zoneMumC.id,
      rating: 4.85,
      totalDeliveries: 98,
      activeOrderCount: 1,
      maxCapacity: 5,
    },
  });

  const agentUser3 = await prisma.user.create({
    data: {
      email: 'priya.agent@delivery.com',
      password: defaultPassword,
      name: 'Priya Sundaram',
      phone: '+91-9877889900',
      role: Role.AGENT,
    },
  });
  const agentProfile3 = await prisma.deliveryAgent.create({
    data: {
      userId: agentUser3.id,
      vehicleType: 'VAN',
      vehicleNumber: 'MH-03-VN-5500',
      status: AgentStatus.AVAILABLE,
      currentLat: 19.1197, // Andheri
      currentLng: 72.8464,
      homeZoneId: zoneMumS.id,
      rating: 4.98,
      totalDeliveries: 230,
      activeOrderCount: 1,
      maxCapacity: 8,
    },
  });

  const agentUser4 = await prisma.user.create({
    data: {
      email: 'vikram.agent@delivery.com',
      password: defaultPassword,
      name: 'Vikram Singh',
      phone: '+91-9955667788',
      role: Role.AGENT,
    },
  });
  const agentProfile4 = await prisma.deliveryAgent.create({
    data: {
      userId: agentUser4.id,
      vehicleType: 'MOTORCYCLE',
      vehicleNumber: 'DL-01-AX-9933',
      status: AgentStatus.AVAILABLE,
      currentLat: 28.6315, // Connaught Place
      currentLng: 77.2167,
      homeZoneId: zoneDel.id,
      rating: 4.79,
      totalDeliveries: 67,
      activeOrderCount: 0,
      maxCapacity: 5,
    },
  });

  // 5. Create Sample Orders Across Different Status Lifecycles
  console.log('🚚 Creating realistic sample orders and immutable audit histories...');

  // Order 1: B2C Intra-Zone - OUT FOR DELIVERY
  const order1 = await prisma.order.create({
    data: {
      trackingNumber: 'TRK-2026-MUM901',
      customerId: customerJohn.id,
      agentId: agentProfile1.id,
      orderType: OrderType.B2C,
      paymentType: PaymentType.COD,
      paymentStatus: PaymentStatus.PENDING_COLLECTION,
      pickupAddress: 'Flat 402, Sea Green Apts, Nariman Point',
      pickupPincode: '400021',
      pickupArea: 'Nariman Point & Marine Drive',
      pickupCity: 'Mumbai',
      pickupLat: 18.9260,
      pickupLng: 72.8234,
      pickupContactName: 'John Fernandes',
      pickupContactPhone: '+91-9876543210',
      pickupZoneId: zoneMumC.id,
      
      dropAddress: 'Tower 3, Peninsula Business Park, Lower Parel',
      dropPincode: '400013',
      dropArea: 'Lower Parel High Street Hub',
      dropCity: 'Mumbai',
      dropLat: 18.9986,
      dropLng: 72.8300,
      dropContactName: 'Rohan Mehta',
      dropContactPhone: '+91-9819001122',
      dropZoneId: zoneMumC.id,
      
      lengthCm: 25,
      widthCm: 15,
      heightCm: 10,
      actualWeightKg: 1.2,
      volumetricWeightKg: 0.75, // (25*15*10)/5000 = 0.75
      chargeableWeightKg: 1.2, // Higher of 1.2 vs 0.75
      
      isIntraZone: true,
      baseRate: 45.0,
      incrementalRate: 25.0,
      baseCharge: 45.0,
      incrementalCharge: 50.0, // (1.2 - 0.5) = 0.7kg -> 2 slabs of 0.5kg -> 2 * 25 = 50
      codSurcharge: 30.0, // COD Min Fee ₹30
      totalAmount: 125.0,
      packageCategory: 'Electronics & Accessories',
      status: OrderStatus.OUT_FOR_DELIVERY,
    },
  });

  // Tracking history for Order 1
  await prisma.trackingHistory.createMany({
    data: [
      {
        orderId: order1.id,
        status: OrderStatus.CONFIRMED,
        actorRole: 'CUSTOMER',
        actorName: 'John Fernandes',
        locationText: 'Nariman Point (MUM-C)',
        remarks: 'Order placed with COD payment (₹125.00).',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000),
      },
      {
        orderId: order1.id,
        status: OrderStatus.ASSIGNED,
        actorRole: 'SYSTEM',
        actorName: 'Auto-Assignment Engine',
        lat: 19.0663,
        lng: 72.8687,
        locationText: 'BKC Hub (MUM-S)',
        remarks: 'Assigned to Rajesh Kumar (MH-01-BK-1080) based on Haversine distance scoring.',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000),
      },
      {
        orderId: order1.id,
        status: OrderStatus.PICKED_UP,
        actorRole: 'AGENT',
        actorName: 'Rajesh Kumar',
        lat: 18.9260,
        lng: 72.8234,
        locationText: 'Nariman Point Pickup Point',
        remarks: 'Package scanned and verified at pickup location.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000),
      },
      {
        orderId: order1.id,
        status: OrderStatus.IN_TRANSIT,
        actorRole: 'AGENT',
        actorName: 'Rajesh Kumar',
        lat: 18.9600,
        lng: 72.8280,
        locationText: 'En route via Marine Drive Corridor',
        remarks: 'Package in transit towards Lower Parel destination.',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000),
      },
      {
        orderId: order1.id,
        status: OrderStatus.OUT_FOR_DELIVERY,
        actorRole: 'AGENT',
        actorName: 'Rajesh Kumar',
        lat: 18.9950,
        lng: 72.8310,
        locationText: 'Lower Parel Delivery Zone',
        remarks: 'Agent is within 1 km of Peninsula Business Park. Preparing delivery.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
    ],
  });

  // Order 2: B2B Inter-Zone Volumetric Package - DELIVERED
  const order2 = await prisma.order.create({
    data: {
      trackingNumber: 'TRK-2026-APX554',
      customerId: customerSarahB2B.id,
      agentId: agentProfile3.id,
      orderType: OrderType.B2B,
      paymentType: PaymentType.PREPAID,
      paymentStatus: PaymentStatus.PAID,
      pickupAddress: 'Apex Warehouse Unit 14, Andheri East Cargo Hub',
      pickupPincode: '400069',
      pickupArea: 'Andheri East Logistics Hub',
      pickupCity: 'Mumbai',
      pickupLat: 19.1197,
      pickupLng: 72.8464,
      pickupContactName: 'Sarah Jenkins',
      pickupContactPhone: '+91-9988776655',
      pickupZoneId: zoneMumS.id,
      
      dropAddress: 'Kalyan Towers, Fort Financial District',
      dropPincode: '400001',
      dropArea: 'Fort & Colaba Financial Center',
      dropCity: 'Mumbai',
      dropLat: 18.9322,
      dropLng: 72.8347,
      dropContactName: 'Finance Desk',
      dropContactPhone: '+91-9820112233',
      dropZoneId: zoneMumC.id,
      
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30,
      actualWeightKg: 4.5,
      volumetricWeightKg: 12.0, // (50*40*30)/5000 = 12.0 kg
      chargeableWeightKg: 12.0, // Billed on volumetric weight!
      
      isIntraZone: false, // MUM-S to MUM-C is Inter-Zone
      baseRate: 210.0,
      incrementalRate: 55.0,
      baseCharge: 210.0,
      incrementalCharge: 550.0, // (12 - 2.0) = 10kg excess -> 10 slabs * 55 = 550
      codSurcharge: 0.0,
      totalAmount: 760.0,
      packageCategory: 'Bulk Server Hardware & Modules',
      status: OrderStatus.DELIVERED,
      proofSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><path d="M10 40 Q 30 10, 50 30 T 90 20" fill="none" stroke="black" stroke-width="2"/></svg>',
    },
  });

  await prisma.trackingHistory.createMany({
    data: [
      {
        orderId: order2.id,
        status: OrderStatus.CONFIRMED,
        actorRole: 'CUSTOMER',
        actorName: 'Sarah Jenkins (Apex Electronics)',
        locationText: 'Andheri East (MUM-S)',
        remarks: 'Prepaid B2B heavy freight shipment created (12.0 kg chargeable volumetric weight).',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000),
      },
      {
        orderId: order2.id,
        status: OrderStatus.ASSIGNED,
        actorRole: 'ADMIN',
        actorName: 'Siddharth Varma (Fleet Director)',
        locationText: 'Operations Center',
        remarks: 'Assigned to Cargo Van Agent Priya Sundaram for high-volume package.',
        timestamp: new Date(Date.now() - 20 * 3600 * 1000),
      },
      {
        orderId: order2.id,
        status: OrderStatus.PICKED_UP,
        actorRole: 'AGENT',
        actorName: 'Priya Sundaram',
        lat: 19.1197,
        lng: 72.8464,
        locationText: 'Apex Warehouse Andheri',
        remarks: 'Picked up 12kg volumetric carton box. Verified barcodes.',
        timestamp: new Date(Date.now() - 16 * 3600 * 1000),
      },
      {
        orderId: order2.id,
        status: OrderStatus.OUT_FOR_DELIVERY,
        actorRole: 'AGENT',
        actorName: 'Priya Sundaram',
        lat: 18.9322,
        lng: 72.8347,
        locationText: 'Fort South Mumbai',
        remarks: 'Dispatched to Kalyan Towers reception.',
        timestamp: new Date(Date.now() - 8 * 3600 * 1000),
      },
      {
        orderId: order2.id,
        status: OrderStatus.DELIVERED,
        actorRole: 'AGENT',
        actorName: 'Priya Sundaram',
        lat: 18.9322,
        lng: 72.8347,
        locationText: 'Kalyan Towers, Fort',
        remarks: 'Package handed over to Finance Desk. Digital signature obtained.',
        proofData: 'Digital Signature Confirmed',
        timestamp: new Date(Date.now() - 6 * 3600 * 1000),
      },
    ],
  });

  // Order 3: FAILED DELIVERY (Ready for testing the customer rescheduling workflow!)
  const order3 = await prisma.order.create({
    data: {
      trackingNumber: 'TRK-2026-FL9003',
      customerId: customerAnita.id,
      orderType: OrderType.B2C,
      paymentType: PaymentType.PREPAID,
      paymentStatus: PaymentStatus.PAID,
      pickupAddress: 'Studio Anita Decor, Indiranagar 100ft Rd',
      pickupPincode: '560038',
      pickupArea: 'Indiranagar 100 Feet Rd',
      pickupCity: 'Bangalore',
      pickupLat: 12.9784,
      pickupLng: 77.6408,
      pickupContactName: 'Anita Sharma',
      pickupContactPhone: '+91-9123456789',
      pickupZoneId: zoneBlr.id,
      
      dropAddress: 'Villa 18, Palm Meadows, Whitefield',
      dropPincode: '560066',
      dropArea: 'Whitefield IT Export Zone',
      dropCity: 'Bangalore',
      dropLat: 12.9698,
      dropLng: 77.7499,
      dropContactName: 'Gaurav Rao',
      dropContactPhone: '+91-9877001122',
      dropZoneId: zoneBlr.id,
      
      lengthCm: 30,
      widthCm: 20,
      heightCm: 15,
      actualWeightKg: 1.8,
      volumetricWeightKg: 1.8,
      chargeableWeightKg: 1.8,
      
      isIntraZone: true,
      baseRate: 45.0,
      incrementalRate: 25.0,
      baseCharge: 45.0,
      incrementalCharge: 75.0,
      codSurcharge: 0.0,
      totalAmount: 120.0,
      packageCategory: 'Handcrafted Glassware (Fragile)',
      status: OrderStatus.FAILED,
      failureReason: 'Customer Unavailable / Door Locked after 3 doorbell attempts and 2 calls',
      failureCount: 1,
    },
  });

  await prisma.trackingHistory.createMany({
    data: [
      {
        orderId: order3.id,
        status: OrderStatus.CONFIRMED,
        actorRole: 'CUSTOMER',
        actorName: 'Anita Sharma',
        locationText: 'Indiranagar (BLR-C)',
        remarks: 'Order booked for handcrafted item.',
        timestamp: new Date(Date.now() - 10 * 3600 * 1000),
      },
      {
        orderId: order3.id,
        status: OrderStatus.ASSIGNED,
        actorRole: 'SYSTEM',
        actorName: 'Auto-Assignment Engine',
        locationText: 'Bangalore Operations',
        remarks: 'Assigned to nearest available delivery partner.',
        timestamp: new Date(Date.now() - 8 * 3600 * 1000),
      },
      {
        orderId: order3.id,
        status: OrderStatus.PICKED_UP,
        actorRole: 'AGENT',
        actorName: 'Amit Patel',
        locationText: 'Indiranagar',
        remarks: 'Package picked up from Anita Decor.',
        timestamp: new Date(Date.now() - 6 * 3600 * 1000),
      },
      {
        orderId: order3.id,
        status: OrderStatus.OUT_FOR_DELIVERY,
        actorRole: 'AGENT',
        actorName: 'Amit Patel',
        locationText: 'Whitefield',
        remarks: 'Arrived at Palm Meadows security gate.',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000),
      },
      {
        orderId: order3.id,
        status: OrderStatus.FAILED,
        actorRole: 'AGENT',
        actorName: 'Amit Patel',
        locationText: 'Palm Meadows, Whitefield',
        remarks: 'Delivery attempted but customer unavailable. Door locked. Notification sent for rescheduling.',
        failureReason: 'Customer Unavailable / Door Locked after 3 doorbell attempts and 2 calls',
        timestamp: new Date(Date.now() - 1 * 3600 * 1000),
      },
    ],
  });

  // Seed Notifications for Order 3
  await prisma.notification.create({
    data: {
      orderId: order3.id,
      recipientUserId: customerAnita.id,
      recipientEmail: 'anita.sharma@gmail.com',
      recipientPhone: '+91-9123456789',
      channel: 'EMAIL',
      title: `Delivery Attempt Failed: ${order3.trackingNumber}`,
      message: `Hello Anita Sharma,\n\nWe attempted to deliver your package #${order3.trackingNumber}, but could not complete delivery. Reason: "Customer Unavailable".\n\n👉 Please click below to reschedule your delivery slot: http://localhost:5173/track/${order3.trackingNumber}?reschedule=true`,
      status: 'DELIVERED',
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('--------------------------------------------------');
  console.log('🔑 DEMO CREDENTIALS:');
  console.log('👑 Admin:     admin@delivery.com          / admin123');
  console.log('👤 Customer:  john@example.com           / password123');
  console.log('🏢 B2B Corp:  sarah.b2b@apexlogistics.com / password123');
  console.log('🛵 Agent:     rajesh.agent@delivery.com   / password123');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
