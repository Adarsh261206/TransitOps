import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('password123', 10);
  const users = await Promise.all([
    prisma.user.upsert({ where: { email: 'fleet@transitops.com' }, update: {}, create: { email: 'fleet@transitops.com', password, name: 'John Fleet', role: Role.FLEET_MANAGER } }),
    prisma.user.upsert({ where: { email: 'dispatcher@transitops.com' }, update: {}, create: { email: 'dispatcher@transitops.com', password, name: 'David Dispatch', role: Role.DISPATCHER } }),
    prisma.user.upsert({ where: { email: 'driver@transitops.com' }, update: {}, create: { email: 'driver@transitops.com', password, name: 'Sarah Driver', role: Role.DRIVER } }),
    prisma.user.upsert({ where: { email: 'safety@transitops.com' }, update: {}, create: { email: 'safety@transitops.com', password, name: 'Mike Safety', role: Role.SAFETY_OFFICER } }),
    prisma.user.upsert({ where: { email: 'finance@transitops.com' }, update: {}, create: { email: 'finance@transitops.com', password, name: 'Emma Finance', role: Role.FINANCIAL_ANALYST } }),
  ]);
  console.log(`Created ${users.length} users`);

  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { registrationNumber: 'TRK-001' },
      update: {},
      create: { registrationNumber: 'TRK-001', name: 'Volvo FH16', type: 'Truck', maxLoadCapacity: 25000, odometer: 45000, acquisitionCost: 150000, region: 'North', manufacturer: 'Volvo', model: 'FH16', fuelType: 'Diesel', insuranceExpiry: new Date('2027-06-30'), pucExpiry: new Date('2026-12-31'), fitnessExpiry: new Date('2027-03-15'), fuelAverage: 4.5 },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'VAN-002' },
      update: {},
      create: { registrationNumber: 'VAN-002', name: 'Ford Transit', type: 'Van', maxLoadCapacity: 1200, odometer: 28000, acquisitionCost: 35000, region: 'South', manufacturer: 'Ford', model: 'Transit', fuelType: 'Diesel', insuranceExpiry: new Date('2026-09-30'), pucExpiry: new Date('2026-08-15'), fuelAverage: 8.2 },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'TRK-003' },
      update: {},
      create: { registrationNumber: 'TRK-003', name: 'Scania R500', type: 'Truck', maxLoadCapacity: 30000, odometer: 62000, acquisitionCost: 180000, region: 'East', manufacturer: 'Scania', model: 'R500', fuelType: 'Diesel', insuranceExpiry: new Date('2027-12-31'), pucExpiry: new Date('2026-11-30'), fuelAverage: 3.8 },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'VAN-004' },
      update: {},
      create: { registrationNumber: 'VAN-004', name: 'Mercedes Sprinter', type: 'Van', maxLoadCapacity: 1500, odometer: 15000, acquisitionCost: 42000, region: 'West', manufacturer: 'Mercedes', model: 'Sprinter', fuelType: 'Diesel', insuranceExpiry: new Date('2027-05-31'), pucExpiry: new Date('2026-10-20'), fuelAverage: 9.1 },
    }),
    prisma.vehicle.upsert({
      where: { registrationNumber: 'TRK-005' },
      update: {},
      create: { registrationNumber: 'TRK-005', name: 'DAF XF', type: 'Truck', maxLoadCapacity: 20000, odometer: 89000, acquisitionCost: 120000, region: 'North', manufacturer: 'DAF', model: 'XF', fuelType: 'Diesel', status: 'IN_SHOP', insuranceExpiry: new Date('2026-08-31'), pucExpiry: new Date('2026-07-15'), fuelAverage: 4.2 },
    }),
  ]);
  console.log(`Created ${vehicles.length} vehicles`);

  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-001' },
      update: {},
      create: { name: 'Alex Johnson', licenseNumber: 'LIC-001', licenseCategory: 'Class A', licenseExpiryDate: new Date('2027-12-31'), medicalExpiryDate: new Date('2027-06-30'), contactNumber: '+1-555-0101', emergencyContact: 'Emma Johnson', emergencyPhone: '+1-555-0109', safetyScore: 9.2, totalTrips: 45, totalDistance: 12500, averageRating: 4.8, violations: 1, fuelEfficiency: 4.7 },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-002' },
      update: {},
      create: { name: 'Maria Garcia', licenseNumber: 'LIC-002', licenseCategory: 'Class B', licenseExpiryDate: new Date('2026-06-30'), medicalExpiryDate: new Date('2026-04-15'), contactNumber: '+1-555-0102', emergencyContact: 'Carlos Garcia', emergencyPhone: '+1-555-0110', safetyScore: 8.7, totalTrips: 32, totalDistance: 8900, averageRating: 4.5, violations: 2, fuelEfficiency: 6.1 },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-003' },
      update: {},
      create: { name: 'James Wilson', licenseNumber: 'LIC-003', licenseCategory: 'Class A', licenseExpiryDate: new Date('2028-03-15'), medicalExpiryDate: new Date('2027-09-30'), contactNumber: '+1-555-0103', emergencyContact: 'Lisa Wilson', emergencyPhone: '+1-555-0111', safetyScore: 7.5, totalTrips: 28, totalDistance: 7200, averageRating: 4.0, violations: 5, status: 'SUSPENDED' },
    }),
    prisma.driver.upsert({
      where: { licenseNumber: 'LIC-004' },
      update: {},
      create: { name: 'Emily Brown', licenseNumber: 'LIC-004', licenseCategory: 'Class C', licenseExpiryDate: new Date('2026-11-20'), medicalExpiryDate: new Date('2026-08-31'), contactNumber: '+1-555-0104', emergencyContact: 'Tom Brown', emergencyPhone: '+1-555-0112', safetyScore: 9.8, totalTrips: 52, totalDistance: 15800, averageRating: 4.9, violations: 0, fuelEfficiency: 5.3 },
    }),
  ]);
  console.log(`Created ${drivers.length} drivers`);

  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
