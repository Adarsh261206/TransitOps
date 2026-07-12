import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const password = await bcrypt.hash('password123', 10);
  const users = await Promise.all([
    prisma.user.upsert({ where: { email: 'fleet@transitops.com' }, update: {}, create: { email: 'fleet@transitops.com', password, name: 'John Fleet', role: Role.FLEET_MANAGER } }),
    prisma.user.upsert({ where: { email: 'dispatcher@transitops.com' }, update: {}, create: { email: 'dispatcher@transitops.com', password, name: 'David Dispatch', role: Role.DISPATCHER } }),
    prisma.user.upsert({ where: { email: 'driver@transitops.com' }, update: {}, create: { email: 'driver@transitops.com', password, name: 'Sarah Driver', role: Role.DRIVER } }),
    prisma.user.upsert({ where: { email: 'safety@transitops.com' }, update: {}, create: { email: 'safety@transitops.com', password, name: 'Mike Safety', role: Role.SAFETY_OFFICER } }),
    prisma.user.upsert({ where: { email: 'finance@transitops.com' }, update: {}, create: { email: 'finance@transitops.com', password, name: 'Emma Finance', role: Role.FINANCIAL_ANALYST } }),
  ]);
  console.log(`Created ${users.length} users`);

  // Create vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { registrationNumber: 'TRK-001' },
      update: {},
      create: { registrationNumber: 'TRK-001', name: 'Volvo FH16', type: 'Truck', maxLoadCapacity: 25000, odometer: 45000, acquisitionCost: 150000, region: 'North' },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'VAN-002' },
      update: {},
      create: { registrationNumber: 'VAN-002', name: 'Ford Transit', type: 'Van', maxLoadCapacity: 1200, odometer: 28000, acquisitionCost: 35000, region: 'South' },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'TRK-003' },
      update: {},
      create: { registrationNumber: 'TRK-003', name: 'Scania R500', type: 'Truck', maxLoadCapacity: 30000, odometer: 62000, acquisitionCost: 180000, region: 'East' },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'VAN-004' },
      update: {},
      create: { registrationNumber: 'VAN-004', name: 'Mercedes Sprinter', type: 'Van', maxLoadCapacity: 1500, odometer: 15000, acquisitionCost: 42000, region: 'West' },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'TRK-005' },
      update: {},
      create: { registrationNumber: 'TRK-005', name: 'DAF XF', type: 'Truck', maxLoadCapacity: 20000, odometer: 89000, acquisitionCost: 120000, region: 'North', status: 'IN_SHOP' },
    }),
  ]);
  console.log(`Created ${vehicles.length} vehicles`);

  // Create drivers
  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-001' },
      update: {},
      create: { name: 'Alex Johnson', licenseNumber: 'LIC-001', licenseCategory: 'Class A', licenseExpiryDate: new Date('2027-12-31'), contactNumber: '+1-555-0101', safetyScore: 9.2 },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-002' },
      update: {},
      create: { name: 'Maria Garcia', licenseNumber: 'LIC-002', licenseCategory: 'Class B', licenseExpiryDate: new Date('2026-06-30'), contactNumber: '+1-555-0102', safetyScore: 8.7 },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-003' },
      update: {},
      create: { name: 'James Wilson', licenseNumber: 'LIC-003', licenseCategory: 'Class A', licenseExpiryDate: new Date('2028-03-15'), contactNumber: '+1-555-0103', safetyScore: 7.5, status: 'SUSPENDED' },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-004' },
      update: {},
      create: { name: 'Emily Brown', licenseNumber: 'LIC-004', licenseCategory: 'Class C', licenseExpiryDate: new Date('2026-11-20'), contactNumber: '+1-555-0104', safetyScore: 9.8 },
    }),
  ]);
  console.log(`Created ${drivers.length} drivers`);

  // Create some trips
  const trip1 = await prisma.trip.create({
    data: {
      source: 'Warehouse A - NYC',
      destination: 'Distribution Center - Boston',
      cargoWeight: 18000,
      plannedDistance: 215,
      actualDistance: 220,
      fuelConsumed: 65,
      finalOdometer: 45220,
      revenue: 4500,
      status: 'COMPLETED',
      vehicleId: vehicles[0].id,
      driverId: drivers[0].id,
      createdById: users[0].id,
    },
  });
  console.log('Created sample trips');

  // Create maintenance
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles[4].id,
      description: 'Oil Change & Filter Replacement',
      type: 'Preventive',
      cost: 350,
      date: new Date(),
      status: 'ACTIVE',
    },
  });
  console.log('Created sample maintenance');

  // Create fuel logs
  await prisma.fuelLog.create({
    data: { vehicleId: vehicles[0].id, liters: 120, cost: 480, date: new Date('2026-07-10') },
  });
  await prisma.fuelLog.create({
    data: { vehicleId: vehicles[1].id, liters: 45, cost: 180, date: new Date('2026-07-11') },
  });

  // Create expenses
  await prisma.expense.create({
    data: { vehicleId: vehicles[0].id, type: 'TOLL', amount: 45, date: new Date('2026-07-10'), description: 'Highway toll NYC-Boston' },
  });

  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
