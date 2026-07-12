import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getDashboardKPIs(req: AuthRequest, res: Response) {
  try {
    const { type, status, region } = req.query;

    const vehicleWhere: any = {};
    if (type) vehicleWhere.type = type;
    if (status) vehicleWhere.status = status;
    if (region) vehicleWhere.region = region;

    const [totalVehicles, activeVehicles, availableVehicles, inShopVehicles, retiredVehicles, totalDrivers, availableDrivers, onTripDrivers, offDutyDrivers, suspendedDrivers, activeTrips, pendingTrips, completedTrips, cancelledTrips] = await Promise.all([
      prisma.vehicle.count({ where: vehicleWhere }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: 'ON_TRIP' } }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: 'IN_SHOP' } }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: 'RETIRED' } }),
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'AVAILABLE' } }),
      prisma.driver.count({ where: { status: 'ON_TRIP' } }),
      prisma.driver.count({ where: { status: 'OFF_DUTY' } }),
      prisma.driver.count({ where: { status: 'SUSPENDED' } }),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.trip.count({ where: { status: 'DRAFT' } }),
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
      prisma.trip.count({ where: { status: 'CANCELLED' } }),
    ]);

    const fleetUtilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    const totalFuelCost = await prisma.fuelLog.aggregate({ _sum: { cost: true } });
    const totalMaintenanceCost = await prisma.maintenanceLog.aggregate({ _sum: { cost: true } });
    const totalOtherExpenses = await prisma.expense.aggregate({ _sum: { amount: true } });

    // Recent trips
    const recentTrips = await prisma.trip.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { id: true, name: true, registrationNumber: true } },
        driver: { select: { id: true, name: true } },
      },
    });

    res.json({
      totalVehicles,
      activeVehicles,
      availableVehicles,
      inShopVehicles,
      retiredVehicles,
      totalDrivers,
      availableDrivers,
      onTripDrivers,
      offDutyDrivers,
      suspendedDrivers,
      activeTrips,
      pendingTrips,
      completedTrips,
      cancelledTrips,
      fleetUtilization,
      totalFuelCost: totalFuelCost._sum.cost || 0,
      totalMaintenanceCost: totalMaintenanceCost._sum.cost || 0,
      totalOtherExpenses: totalOtherExpenses._sum.amount || 0,
      recentTrips,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
