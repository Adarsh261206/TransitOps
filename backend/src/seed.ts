import { PrismaClient, Role, TripStatus, DriverStatus, VehicleStatus, ExpenseType, IncidentSeverity, IncidentStatus, MaintenanceStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper: get a date N days ago
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// Helper: get a date N months ago
function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

// Helper: random float between min and max
function rand(min: number, max: number, decimals = 0): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

async function main() {
  console.log('🌱 Seeding database with rich Indian data...');

  // ─── USERS ────────────────────────────────────────────────────────────────
  const password = await bcrypt.hash('password123', 10);
  const users = await Promise.all([
    prisma.user.upsert({ where: { email: 'fleet@transitops.com' },    update: { name: 'Rajesh Kumar',  isVerified: true }, create: { email: 'fleet@transitops.com',      password, name: 'Rajesh Kumar',  role: Role.FLEET_MANAGER,     isVerified: true } }),
    prisma.user.upsert({ where: { email: 'dispatcher@transitops.com' }, update: { name: 'Priya Sharma', isVerified: true }, create: { email: 'dispatcher@transitops.com', password, name: 'Priya Sharma', role: Role.DISPATCHER,         isVerified: true } }),
    prisma.user.upsert({ where: { email: 'driver@transitops.com' },   update: { name: 'Amit Singh',   isVerified: true }, create: { email: 'driver@transitops.com',      password, name: 'Amit Singh',   role: Role.DRIVER,             isVerified: true } }),
    prisma.user.upsert({ where: { email: 'safety@transitops.com' },   update: { name: 'Vikram Patel', isVerified: true }, create: { email: 'safety@transitops.com',      password, name: 'Vikram Patel', role: Role.SAFETY_OFFICER,     isVerified: true } }),
    prisma.user.upsert({ where: { email: 'finance@transitops.com' },  update: { name: 'Neha Gupta',   isVerified: true }, create: { email: 'finance@transitops.com',     password, name: 'Neha Gupta',   role: Role.FINANCIAL_ANALYST,  isVerified: true } }),
  ]);
  console.log(`✅ Users: ${users.length}`);

  // ─── VEHICLES ─────────────────────────────────────────────────────────────
  const v1 = await prisma.vehicle.upsert({ where: { registrationNumber: 'DL-01-AB-1234' }, update: {}, create: { registrationNumber: 'DL-01-AB-1234', name: 'Tata Prima 4940.S', type: 'Truck', maxLoadCapacity: 25000, odometer: 45000, acquisitionCost: 4500000, acquisitionDate: new Date('2022-03-15'), region: 'North', manufacturer: 'Tata Motors', model: 'Prima 4940.S', fuelType: 'Diesel', owner: 'TransitOps Pvt Ltd', insuranceExpiry: new Date('2027-06-30'), pucExpiry: new Date('2026-12-31'), permitExpiry: new Date('2027-02-28'), fitnessExpiry: new Date('2027-03-15'), fuelAverage: 4.5, status: VehicleStatus.AVAILABLE } });
  const v2 = await prisma.vehicle.upsert({ where: { registrationNumber: 'MH-02-CD-5678' }, update: {}, create: { registrationNumber: 'MH-02-CD-5678', name: 'Mahindra Bolero Pikup', type: 'Van', maxLoadCapacity: 1200, odometer: 28000, acquisitionCost: 950000, acquisitionDate: new Date('2023-06-20'), region: 'West', manufacturer: 'Mahindra', model: 'Bolero Pikup', fuelType: 'Diesel', owner: 'TransitOps Pvt Ltd', insuranceExpiry: new Date('2026-09-30'), pucExpiry: new Date('2026-08-15'), permitExpiry: new Date('2027-05-31'), fuelAverage: 15.2, status: VehicleStatus.AVAILABLE } });
  const v3 = await prisma.vehicle.upsert({ where: { registrationNumber: 'KA-03-EF-9012' }, update: {}, create: { registrationNumber: 'KA-03-EF-9012', name: 'Ashok Leyland 2518', type: 'Truck', maxLoadCapacity: 18000, odometer: 62000, acquisitionCost: 3800000, acquisitionDate: new Date('2021-11-10'), region: 'South', manufacturer: 'Ashok Leyland', model: '2518', fuelType: 'Diesel', owner: 'TransitOps Pvt Ltd', insuranceExpiry: new Date('2027-12-31'), pucExpiry: new Date('2026-11-30'), permitExpiry: new Date('2026-12-15'), fitnessExpiry: new Date('2026-11-10'), fuelAverage: 5.8, status: VehicleStatus.AVAILABLE } });
  const v4 = await prisma.vehicle.upsert({ where: { registrationNumber: 'GJ-04-GH-3456' }, update: {}, create: { registrationNumber: 'GJ-04-GH-3456', name: 'Eicher Pro 1110XP', type: 'Truck', maxLoadCapacity: 7000, odometer: 35000, acquisitionCost: 1850000, acquisitionDate: new Date('2022-08-05'), region: 'West', manufacturer: 'Eicher', model: 'Pro 1110XP', fuelType: 'Diesel', owner: 'TransitOps Pvt Ltd', insuranceExpiry: new Date('2027-08-05'), pucExpiry: new Date('2026-07-31'), permitExpiry: new Date('2027-08-05'), fitnessExpiry: new Date('2027-08-05'), fuelAverage: 10.5, status: VehicleStatus.AVAILABLE } });
  const v5 = await prisma.vehicle.upsert({ where: { registrationNumber: 'UP-05-IJ-7890' }, update: {}, create: { registrationNumber: 'UP-05-IJ-7890', name: 'BharatBenz 1617R', type: 'Truck', maxLoadCapacity: 10000, odometer: 89000, acquisitionCost: 2650000, acquisitionDate: new Date('2020-05-12'), region: 'North', manufacturer: 'BharatBenz', model: '1617R', fuelType: 'Diesel', owner: 'TransitOps Pvt Ltd', insuranceExpiry: new Date('2026-08-31'), pucExpiry: new Date('2026-07-15'), permitExpiry: new Date('2026-05-12'), fitnessExpiry: new Date('2026-05-12'), fuelAverage: 6.2, status: VehicleStatus.IN_SHOP } });
  const vehicles = [v1, v2, v3, v4, v5];
  console.log(`✅ Vehicles: ${vehicles.length}`);

  // ─── DRIVERS ──────────────────────────────────────────────────────────────
  const d1 = await prisma.driver.upsert({ where: { licenseNumber: 'DL1420230012345' }, update: {}, create: { name: 'Suresh Kumar',  licenseNumber: 'DL1420230012345', licenseCategory: 'Heavy Vehicle',  licenseExpiryDate: new Date('2027-12-31'), medicalExpiryDate: new Date('2027-06-30'), insuranceExpiry: new Date('2027-03-31'), policeVerification: true,  contactNumber: '+91-9876543210', emergencyContact: 'Sunita Kumar',  emergencyPhone: '+91-9876543211', address: 'Sector 15, Rohini, Delhi - 110085',            safetyScore: 9.2, totalTrips: 45, totalDistance: 12500, averageRating: 4.8, violations: 1, fuelEfficiency: 4.7, status: DriverStatus.AVAILABLE } });
  const d2 = await prisma.driver.upsert({ where: { licenseNumber: 'MH1220220034567' }, update: {}, create: { name: 'Ramesh Patil',  licenseNumber: 'MH1220220034567', licenseCategory: 'Medium Vehicle', licenseExpiryDate: new Date('2026-06-30'), medicalExpiryDate: new Date('2026-04-15'), insuranceExpiry: new Date('2026-06-30'), policeVerification: true,  contactNumber: '+91-9123456789', emergencyContact: 'Rekha Patil',   emergencyPhone: '+91-9123456788', address: 'Andheri West, Mumbai - 400058',                safetyScore: 8.7, totalTrips: 32, totalDistance: 8900,  averageRating: 4.5, violations: 2, fuelEfficiency: 6.1, status: DriverStatus.AVAILABLE } });
  const d3 = await prisma.driver.upsert({ where: { licenseNumber: 'KA0520210045678' }, update: {}, create: { name: 'Ganesh Reddy',  licenseNumber: 'KA0520210045678', licenseCategory: 'Heavy Vehicle',  licenseExpiryDate: new Date('2028-03-15'), medicalExpiryDate: new Date('2027-09-30'), insuranceExpiry: new Date('2027-03-15'), policeVerification: false, contactNumber: '+91-9845012345', emergencyContact: 'Lakshmi Reddy', emergencyPhone: '+91-9845012346', address: 'Whitefield, Bengaluru - 560066',              safetyScore: 7.5, totalTrips: 28, totalDistance: 7200,  averageRating: 4.0, violations: 5, status: DriverStatus.SUSPENDED } });
  const d4 = await prisma.driver.upsert({ where: { licenseNumber: 'GJ0120220056789' }, update: {}, create: { name: 'Prakash Mehta', licenseNumber: 'GJ0120220056789', licenseCategory: 'Heavy Vehicle',  licenseExpiryDate: new Date('2026-11-20'), medicalExpiryDate: new Date('2026-08-31'), insuranceExpiry: new Date('2026-11-20'), policeVerification: true,  contactNumber: '+91-9898765432', emergencyContact: 'Hiral Mehta',   emergencyPhone: '+91-9898765433', address: 'Satellite Road, Ahmedabad - 380015',           safetyScore: 9.8, totalTrips: 52, totalDistance: 15800, averageRating: 4.9, violations: 0, fuelEfficiency: 5.3, status: DriverStatus.AVAILABLE } });
  const drivers = [d1, d2, d3, d4];
  console.log(`✅ Drivers: ${drivers.length}`);

  // ─── TRIPS (last 6 months, realistic Indian routes) ───────────────────────
  const tripRoutes = [
    { source: 'Delhi NCR Warehouse', destination: 'Mumbai Port', distance: 1450, cargo: 'Electronics', weight: 8000, fuelRate: 4.5 },
    { source: 'Mumbai Dockyard', destination: 'Pune Distribution Centre', distance: 165, cargo: 'FMCG Goods', weight: 3500, fuelRate: 5.2 },
    { source: 'Chennai Factory', destination: 'Bengaluru Depot', distance: 350, cargo: 'Auto Parts', weight: 12000, fuelRate: 5.8 },
    { source: 'Ahmedabad Hub', destination: 'Surat Warehouse', distance: 270, cargo: 'Textile',  weight: 5000, fuelRate: 10.5 },
    { source: 'Kolkata Port', destination: 'Patna Cold Storage', distance: 580, cargo: 'Perishable Goods', weight: 4000, fuelRate: 6.2 },
    { source: 'Jaipur Depot', destination: 'Delhi NCR Warehouse', distance: 280, cargo: 'Handicrafts', weight: 2000, fuelRate: 10.5 },
    { source: 'Hyderabad Factory', destination: 'Chennai Factory', distance: 630, cargo: 'Steel Coils', weight: 18000, fuelRate: 5.8 },
    { source: 'Lucknow Hub', destination: 'Kanpur Depot', distance: 85, cargo: 'Agricultural Produce', weight: 6000, fuelRate: 6.2 },
    { source: 'Nagpur Junction', destination: 'Bhopal Depot', distance: 320, cargo: 'Cement Bags', weight: 20000, fuelRate: 4.5 },
    { source: 'Bengaluru Depot', destination: 'Mysuru Distribution', distance: 145, cargo: 'Pharma Products', weight: 1500, fuelRate: 15.2 },
  ];

  const tripVehicleDriverPairs = [
    { v: v1, d: d1 }, { v: v2, d: d2 }, { v: v3, d: d4 }, { v: v4, d: d1 },
    { v: v1, d: d4 }, { v: v2, d: d2 }, { v: v3, d: d1 }, { v: v4, d: d4 },
    { v: v1, d: d2 }, { v: v3, d: d4 },
  ];

  const createdTrips = [];
  // 30 completed trips spread over last 6 months
  for (let i = 0; i < 30; i++) {
    const route = tripRoutes[i % tripRoutes.length];
    const pair = tripVehicleDriverPairs[i % tripVehicleDriverPairs.length];
    const daysBack = Math.floor(i * 6) + 2;
    const fuelConsumed = parseFloat((route.distance / route.fuelRate).toFixed(1));
    const revenue = Math.round(route.distance * rand(35, 55, 0) + route.weight * rand(1.5, 3.5, 2));
    const toll = Math.round(route.distance * rand(1.2, 2.5, 0));
    const trip = await prisma.trip.create({ data: {
      source: route.source, destination: route.destination, cargoWeight: route.weight,
      goodsType: route.cargo, priority: ['Low','Medium','High'][i % 3],
      plannedDistance: route.distance, actualDistance: route.distance + rand(-20, 20, 1),
      fuelConsumed, finalOdometer: pair.v.odometer + route.distance,
      revenue, toll, expenses: toll + rand(200, 800, 0),
      estimatedCost: Math.round(fuelConsumed * 95 + toll),
      remarks: 'Delivered on time', status: TripStatus.COMPLETED,
      vehicleId: pair.v.id, driverId: pair.d.id, createdById: users[1].id,
      createdAt: daysAgo(daysBack), updatedAt: daysAgo(daysBack - 1),
    }});
    createdTrips.push(trip);
  }

  // 5 active / recent trips
  const activeStatuses = [TripStatus.DISPATCHED, TripStatus.ASSIGNED, TripStatus.REACHED, TripStatus.DRAFT, TripStatus.DELIVERED];
  for (let i = 0; i < 5; i++) {
    const route = tripRoutes[i];
    const pair = tripVehicleDriverPairs[i];
    await prisma.trip.create({ data: {
      source: route.source, destination: route.destination, cargoWeight: route.weight,
      goodsType: route.cargo, priority: ['High','Medium','High','Low','Medium'][i],
      plannedDistance: route.distance, estimatedCost: Math.round(route.distance * 1.8),
      status: activeStatuses[i], vehicleId: pair.v.id, driverId: pair.d.id, createdById: users[1].id,
      createdAt: daysAgo(i + 1), updatedAt: daysAgo(i),
    }});
  }
  console.log(`✅ Trips: ${createdTrips.length + 5}`);

  // ─── FUEL LOGS (monthly, per vehicle, 6 months) ───────────────────────────
  const fuelVehicles = [v1, v2, v3, v4];
  for (let month = 5; month >= 0; month--) {
    for (const vehicle of fuelVehicles) {
      const fillUps = vehicle.fuelType === 'Diesel' ? 4 : 3;
      for (let f = 0; f < fillUps; f++) {
        const date = monthsAgo(month);
        date.setDate(f * 7 + 2);
        const liters = rand(80, 250, 1);
        const pricePerLitre = rand(92, 98, 2); // realistic diesel price in India
        await prisma.fuelLog.create({ data: {
          vehicleId: vehicle.id, liters, cost: parseFloat((liters * pricePerLitre).toFixed(2)),
          date, mileage: rand(3.5, 12, 2),
          driverId: [d1.id, d2.id, d4.id][Math.floor(Math.random() * 3)],
        }});
      }
    }
  }
  console.log(`✅ Fuel logs created`);

  // ─── EXPENSES (last 6 months) ─────────────────────────────────────────────
  const expenseData = [
    { type: ExpenseType.TOLL,      amounts: [850, 1200, 650, 980, 1100, 750],   vehicle: v1 },
    { type: ExpenseType.REPAIR,    amounts: [12000, 0, 8500, 0, 15000, 0],       vehicle: v1 },
    { type: ExpenseType.INSURANCE, amounts: [18500, 0, 0, 18500, 0, 0],          vehicle: v2 },
    { type: ExpenseType.TOLL,      amounts: [420, 560, 380, 720, 490, 610],      vehicle: v2 },
    { type: ExpenseType.REPAIR,    amounts: [0, 5500, 0, 9800, 0, 4200],         vehicle: v3 },
    { type: ExpenseType.FINE,      amounts: [2000, 0, 0, 1500, 0, 0],            vehicle: v3 },
    { type: ExpenseType.TOLL,      amounts: [680, 890, 540, 760, 830, 470],      vehicle: v3 },
    { type: ExpenseType.PARKING,   amounts: [300, 250, 400, 350, 200, 450],      vehicle: v4 },
    { type: ExpenseType.REPAIR,    amounts: [0, 22000, 0, 0, 18000, 0],          vehicle: v4 },
    { type: ExpenseType.TOLL,      amounts: [920, 1050, 780, 1150, 870, 990],    vehicle: v4 },
    { type: ExpenseType.OTHER,     amounts: [1500, 800, 2000, 1200, 900, 1800],  vehicle: v1 },
    { type: ExpenseType.SALARY,    amounts: [35000, 35000, 35000, 35000, 35000, 35000], vehicle: v1 },
  ];

  for (const exp of expenseData) {
    for (let month = 0; month < 6; month++) {
      const amount = exp.amounts[month];
      if (amount === 0) continue;
      const date = monthsAgo(5 - month);
      date.setDate(rand(1, 25, 0));
      await prisma.expense.create({ data: {
        vehicleId: exp.vehicle.id, type: exp.type, amount,
        date, description: `${exp.type} - ${exp.vehicle.name}`,
        category: exp.type.toLowerCase(),
      }});
    }
  }
  console.log(`✅ Expenses created`);

  // ─── MAINTENANCE LOGS ─────────────────────────────────────────────────────
  const maintenanceItems = [
    { vehicleId: v1.id, type: 'Scheduled Service',  desc: 'Engine oil change, filter replacement, brake inspection',          cost: 8500,  priority: 'Medium', status: MaintenanceStatus.CLOSED, daysBack: 90 },
    { vehicleId: v1.id, type: 'Tyre Replacement',   desc: 'Replaced 6 front and rear tyres',                                 cost: 42000, priority: 'High',   status: MaintenanceStatus.CLOSED, daysBack: 60 },
    { vehicleId: v2.id, type: 'Scheduled Service',  desc: 'Routine 10,000 km service - oil, coolant, air filter',            cost: 4200,  priority: 'Medium', status: MaintenanceStatus.CLOSED, daysBack: 75 },
    { vehicleId: v2.id, type: 'Electrical Repair',  desc: 'Alternator replacement and wiring harness check',                 cost: 9800,  priority: 'High',   status: MaintenanceStatus.CLOSED, daysBack: 45 },
    { vehicleId: v3.id, type: 'Brake Overhaul',     desc: 'Complete brake system overhaul - pads, rotors, fluid',            cost: 15500, priority: 'Critical', status: MaintenanceStatus.CLOSED, daysBack: 55 },
    { vehicleId: v3.id, type: 'Scheduled Service',  desc: 'Engine tune-up, injector cleaning, oil change',                  cost: 7800,  priority: 'Medium', status: MaintenanceStatus.CLOSED, daysBack: 30 },
    { vehicleId: v4.id, type: 'AC Repair',          desc: 'Compressor replacement and refrigerant refill',                   cost: 12000, priority: 'Low',    status: MaintenanceStatus.CLOSED, daysBack: 40 },
    { vehicleId: v4.id, type: 'Suspension Repair',  desc: 'Leaf spring and shock absorber replacement',                     cost: 18500, priority: 'High',   status: MaintenanceStatus.CLOSED, daysBack: 20 },
    { vehicleId: v5.id, type: 'Engine Overhaul',    desc: 'Major engine overhaul - pistons, rings, gaskets',                cost: 95000, priority: 'Critical', status: MaintenanceStatus.ACTIVE,  daysBack: 5  },
    { vehicleId: v5.id, type: 'Gearbox Repair',     desc: 'Gearbox oil seal replacement and gear synchronizer repair',      cost: 38000, priority: 'High',   status: MaintenanceStatus.ACTIVE,  daysBack: 3  },
    { vehicleId: v1.id, type: 'Annual Inspection',  desc: 'Fitness certificate renewal inspection - all systems checked',   cost: 3500,  priority: 'Medium', status: MaintenanceStatus.ACTIVE,  daysBack: 2  },
    { vehicleId: v3.id, type: 'Tyre Rotation',      desc: 'Tyre rotation and alignment check',                              cost: 2800,  priority: 'Low',    status: MaintenanceStatus.ACTIVE,  daysBack: 1  },
  ];

  for (const m of maintenanceItems) {
    await prisma.maintenanceLog.create({ data: {
      vehicleId: m.vehicleId, description: m.desc, type: m.type, cost: m.cost,
      actualCost: m.status === MaintenanceStatus.CLOSED ? m.cost + rand(-500, 2000, 0) : undefined,
      date: daysAgo(m.daysBack), priority: m.priority, status: m.status,
      vendor: ['Tata Motors Service', 'Ashok Leyland ASC', 'Mahindra Service Hub', 'Roadside Motors'][Math.floor(Math.random() * 4)],
      completedDate: m.status === MaintenanceStatus.CLOSED ? daysAgo(m.daysBack - 3) : undefined,
    }});
  }
  console.log(`✅ Maintenance logs: ${maintenanceItems.length}`);

  // ─── INCIDENTS ────────────────────────────────────────────────────────────
  const incidents = [
    { title: 'Minor collision at toll plaza', desc: 'Vehicle grazed the toll booth barrier while exiting. Minor dent on bumper.', severity: IncidentSeverity.LOW, status: IncidentStatus.RESOLVED, vehicleId: v2.id, driverId: d2.id, location: 'NH-48, Gurgaon Toll Plaza', daysBack: 45, resolvedDaysBack: 40 },
    { title: 'Tyre blowout on highway',       desc: 'Rear tyre burst on NH-44 near Nagpur. Driver safely stopped the vehicle.', severity: IncidentSeverity.MEDIUM, status: IncidentStatus.RESOLVED, vehicleId: v3.id, driverId: d4.id, location: 'NH-44, Near Nagpur', daysBack: 30, resolvedDaysBack: 28 },
    { title: 'Cargo spillage at depot',       desc: 'Cement bags fell during unloading due to improper stacking. 200kg cargo lost.', severity: IncidentSeverity.MEDIUM, status: IncidentStatus.CLOSED, vehicleId: v1.id, driverId: d1.id, location: 'Nagpur Junction Depot', daysBack: 20, resolvedDaysBack: 17 },
    { title: 'Engine overheating',            desc: 'Engine overheated on Bengaluru-Chennai stretch. Coolant leak detected.', severity: IncidentSeverity.HIGH, status: IncidentStatus.RESOLVED, vehicleId: v5.id, driverId: d1.id, location: 'NH-44, Krishnagiri', daysBack: 10, resolvedDaysBack: 7 },
    { title: 'Over-speeding challan',         desc: 'Driver caught over-speeding by camera at 94 km/h in 60 km/h zone.', severity: IncidentSeverity.LOW, status: IncidentStatus.CLOSED, vehicleId: v4.id, driverId: d2.id, location: 'NH-27, Ahmedabad Bypass', daysBack: 15, resolvedDaysBack: 14 },
    { title: 'Brake failure warning',         desc: 'Dashboard warning for brake pressure drop. Vehicle sent for immediate inspection.', severity: IncidentSeverity.CRITICAL, status: IncidentStatus.INVESTIGATING, vehicleId: v5.id, driverId: d1.id, location: 'Delhi-Jaipur Highway NH-48', daysBack: 4, resolvedDaysBack: 0 },
    { title: 'Goods damaged in transit',      desc: 'Electronic goods damaged due to road vibrations. Insurance claim filed.', severity: IncidentSeverity.HIGH, status: IncidentStatus.REPORTED, vehicleId: v1.id, driverId: d4.id, location: 'NH-19, Kanpur', daysBack: 2, resolvedDaysBack: 0 },
  ];

  for (const inc of incidents) {
    await prisma.incident.create({ data: {
      title: inc.title, description: inc.desc, severity: inc.severity, status: inc.status,
      vehicleId: inc.vehicleId, driverId: inc.driverId, reportedById: users[3].id,
      location: inc.location, date: daysAgo(inc.daysBack),
      resolvedAt: inc.resolvedDaysBack > 0 ? daysAgo(inc.resolvedDaysBack) : undefined,
      resolution: inc.resolvedDaysBack > 0 ? 'Issue resolved and vehicle cleared for operation.' : undefined,
    }});
  }
  console.log(`✅ Incidents: ${incidents.length}`);

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────
  const notifs = [
    { title: 'License Expiry Alert',       message: 'Ramesh Patil\'s license expires in 28 days (30 Jun 2026). Please initiate renewal.', type: 'warning', module: 'drivers' },
    { title: 'PUC Expiry Warning',         message: 'GJ-04-GH-3456 (Eicher Pro 1110XP) PUC expires on 31 Jul 2026.', type: 'warning', module: 'vehicles' },
    { title: 'Maintenance Due',            message: 'Tata Prima 4940.S is due for scheduled service (every 10,000 km).', type: 'info', module: 'maintenance' },
    { title: 'Trip Completed',             message: 'Trip: Delhi NCR → Mumbai Port completed successfully by Suresh Kumar.', type: 'success', module: 'trips' },
    { title: 'Critical Incident Reported', message: 'Brake failure warning reported for BharatBenz 1617R. Immediate inspection required.', type: 'error', module: 'incidents' },
    { title: 'Insurance Expiry Alert',     message: 'MH-02-CD-5678 (Mahindra Bolero Pikup) insurance expires on 30 Sep 2026.', type: 'warning', module: 'vehicles' },
    { title: 'Driver Suspended',           message: 'Ganesh Reddy has been suspended due to repeated violations (5 violations).', type: 'error', module: 'drivers' },
    { title: 'New Trip Assigned',          message: 'New trip from Ahmedabad Hub to Surat Warehouse assigned to Prakash Mehta.', type: 'info', module: 'trips' },
    { title: 'Fuel Cost Spike',            message: 'Monthly fuel cost increased by 12% compared to last month.', type: 'warning', module: 'finance' },
    { title: 'Fitness Certificate Expiry', message: 'UP-05-IJ-7890 fitness certificate expired. Vehicle currently in shop.', type: 'error', module: 'vehicles' },
  ];

  for (let i = 0; i < notifs.length; i++) {
    await prisma.notification.create({ data: {
      ...notifs[i], userId: users[0].id, read: i > 5,
      createdAt: daysAgo(i),
    }});
  }
  console.log(`✅ Notifications: ${notifs.length}`);

  // ─── AUDIT LOGS ───────────────────────────────────────────────────────────
  const auditEntries = [
    { action: 'CREATE', entity: 'Trip',    desc: 'New trip created: Delhi NCR → Mumbai Port',       userId: users[1].id },
    { action: 'UPDATE', entity: 'Vehicle', desc: 'Vehicle status changed to IN_SHOP: BharatBenz 1617R', userId: users[0].id },
    { action: 'CREATE', entity: 'Incident', desc: 'Incident reported: Brake failure warning',        userId: users[3].id },
    { action: 'UPDATE', entity: 'Driver',  desc: 'Driver suspended: Ganesh Reddy',                  userId: users[3].id },
    { action: 'UPDATE', entity: 'Trip',    desc: 'Trip status updated to COMPLETED',                 userId: users[1].id },
    { action: 'CREATE', entity: 'Maintenance', desc: 'Maintenance log created: Engine Overhaul',     userId: users[0].id },
    { action: 'CREATE', entity: 'Expense', desc: 'Expense recorded: Tyre replacement ₹42,000',      userId: users[0].id },
    { action: 'UPDATE', entity: 'Vehicle', desc: 'Vehicle insurance renewed: Tata Prima 4940.S',    userId: users[0].id },
    { action: 'CREATE', entity: 'FuelLog', desc: 'Fuel filled: 220L for DL-01-AB-1234',             userId: users[2].id },
    { action: 'UPDATE', entity: 'Driver',  desc: 'Driver safety score updated: Prakash Mehta → 9.8', userId: users[3].id },
  ];

  for (let i = 0; i < auditEntries.length; i++) {
    await prisma.auditLog.create({ data: {
      action: auditEntries[i].action, entity: auditEntries[i].entity,
      description: auditEntries[i].desc, userId: auditEntries[i].userId,
      createdAt: daysAgo(i * 2),
    }});
  }
  console.log(`✅ Audit logs: ${auditEntries.length}`);

  console.log('\n🎉 Seeding complete! All data ready for dashboards and reports.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
