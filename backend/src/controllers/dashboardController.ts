import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../index.js';

export async function getFleetManagerDashboard(req: AuthRequest, res: Response) {
  try {
    const [
      totalVehicles, availableVehicles, inShopVehicles, onTripVehicles,
      maintenanceDue, totalDrivers, activeTrips
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
      prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
      prisma.maintenanceLog.count({ where: { status: 'ACTIVE' } }),
      prisma.driver.count(),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
    ]);

    const recentMaintenance = await prisma.maintenanceLog.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { vehicle: { select: { name: true, registrationNumber: true } } },
    });

    res.json({
      fleetUtilization: totalVehicles ? Math.round((onTripVehicles / totalVehicles) * 100) : 0,
      totalVehicles, availableVehicles, inShopVehicles, onTripVehicles,
      maintenanceDue, totalDrivers, activeTrips,
      recentMaintenance,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function getDispatcherDashboard(req: AuthRequest, res: Response) {
  try {
    const [
      todayTripsCount, pendingDispatch, inProgress,
      availableVehicles, availableDrivers,
    ] = await Promise.all([
      prisma.trip.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.trip.count({ where: { status: 'DRAFT' } }),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.driver.count({ where: { status: 'AVAILABLE' } }),
    ]);

    const recentTrips = await prisma.trip.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { vehicle: { select: { name: true, registrationNumber: true } }, driver: { select: { name: true } } },
    });

    res.json({
      todayTripsCount, pendingDispatch, inProgress,
      availableVehicles, availableDrivers, recentTrips,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function getSafetyOfficerDashboard(req: AuthRequest, res: Response) {
  try {
    const allDrivers = await prisma.driver.findMany({ include: { _count: { select: { trips: true } } } });
    const now = new Date();
    const expiredLicenses = allDrivers.filter(d => new Date(d.licenseExpiryDate) < now).length;
    const suspended = allDrivers.filter(d => d.status === 'SUSPENDED').length;
    const available = allDrivers.filter(d => d.status === 'AVAILABLE').length;
    const total = allDrivers.length;
    const avgSafetyScore = total ? Math.round(allDrivers.reduce((s, d) => s + d.safetyScore, 0) / total) : 0;

    res.json({
      totalDrivers: total, expiredLicenses, suspendedDrivers: suspended,
      availableDrivers: available, avgSafetyScore,
      complianceRate: total ? Math.round(((total - expiredLicenses) / total) * 100) : 100,
      drivers: allDrivers.slice(0, 10),
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function getFinancialAnalystDashboard(req: AuthRequest, res: Response) {
  try {
    const [fuelAgg, expenseAgg, tripAgg] = await Promise.all([
      prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.trip.aggregate({ _sum: { revenue: true, actualDistance: true } }),
    ]);

    const totalFuelCost = fuelAgg._sum.cost || 0;
    const totalFuelLiters = fuelAgg._sum.liters || 0;
    const totalExpenses = expenseAgg._sum.amount || 0;
    const totalRevenue = tripAgg._sum.revenue || 0;
    const totalDistance = tripAgg._sum.actualDistance || 0;
    const roi = totalRevenue ? Math.round(((totalRevenue - totalFuelCost - totalExpenses) / (totalFuelCost + totalExpenses)) * 100) : 0;

    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyFuel = await prisma.fuelLog.findMany({
      where: { date: { gte: sixMonthsAgo } },
      orderBy: { date: 'asc' },
    });
    const monthlyExpenses = await prisma.expense.findMany({
      where: { date: { gte: sixMonthsAgo } },
      orderBy: { date: 'asc' },
    });

    res.json({
      totalFuelCost, totalFuelLiters, totalExpenses, totalRevenue, totalDistance, roi,
      monthlyFuel, monthlyExpenses,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
