import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../index.js';

export async function getFleetManagerDashboard(req: AuthRequest, res: Response) {
  try {
    const [totalVehicles, availableVehicles, inShopVehicles, onTripVehicles, reservedVehicles, retiredVehicles,
      maintenanceDue, totalDrivers, activeTrips, pendingApprovals, notifications] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
      prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
      prisma.vehicle.count({ where: { status: 'RESERVED' } }),
      prisma.vehicle.count({ where: { status: 'RETIRED' } }),
      prisma.maintenanceLog.count({ where: { status: 'ACTIVE' } }),
      prisma.driver.count(),
      prisma.trip.count({ where: { status: { in: ['DISPATCHED', 'ASSIGNED'] } } }),
      prisma.maintenanceLog.count({ where: { status: 'ACTIVE', priority: 'Critical' } }),
      prisma.notification.count({ where: { read: false } }),
    ]);

    const recentMaintenance = await prisma.maintenanceLog.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { vehicle: { select: { name: true, registrationNumber: true } } },
    });
    const recentTrips = await prisma.trip.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { vehicle: { select: { name: true, registrationNumber: true } }, driver: { select: { name: true } } },
    });

    res.json({
      fleetUtilization: totalVehicles ? Math.round(((onTripVehicles + reservedVehicles) / totalVehicles) * 100) : 0,
      totalVehicles, availableVehicles, inShopVehicles, onTripVehicles, reservedVehicles, retiredVehicles,
      maintenanceDue, totalDrivers, activeTrips, pendingApprovals, unreadNotifications: notifications,
      recentMaintenance, recentTrips,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function getDispatcherDashboard(req: AuthRequest, res: Response) {
  try {
    const [todayTripsCount, pendingDispatch, inProgress, completed, cancelled,
      availableVehicles, availableDrivers] = await Promise.all([
      prisma.trip.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.trip.count({ where: { status: 'DRAFT' } }),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
      prisma.trip.count({ where: { status: 'CANCELLED' } }),
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.driver.count({ where: { status: 'AVAILABLE' } }),
    ]);

    const recentTrips = await prisma.trip.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { vehicle: { select: { name: true, registrationNumber: true } }, driver: { select: { name: true } } },
    });

    res.json({ todayTripsCount, pendingDispatch, inProgress, completed, cancelled, availableVehicles, availableDrivers, recentTrips });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function getSafetyOfficerDashboard(req: AuthRequest, res: Response) {
  try {
    const allDrivers = await prisma.driver.findMany({ include: { _count: { select: { trips: true } } } });
    const now = new Date();
    const expiredLicenses = allDrivers.filter(d => new Date(d.licenseExpiryDate) < now).length;
    const expiringSoon = allDrivers.filter(d => {
      const diff = new Date(d.licenseExpiryDate).getTime() - now.getTime();
      return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
    }).length;
    const suspended = allDrivers.filter(d => d.status === 'SUSPENDED').length;
    const available = allDrivers.filter(d => d.status === 'AVAILABLE').length;
    const total = allDrivers.length;
    const avgSafetyScore = total ? Math.round(allDrivers.reduce((s, d) => s + d.safetyScore, 0) / total) : 0;
    const totalViolations = allDrivers.reduce((s, d) => s + d.violations, 0);

    res.json({
      totalDrivers: total, expiredLicenses, expiringSoon, suspendedDrivers: suspended,
      availableDrivers: available, avgSafetyScore, totalViolations,
      complianceRate: total ? Math.round(((total - expiredLicenses) / total) * 100) : 100,
      drivers: allDrivers.slice(0, 10),
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}

export async function getFinancialAnalystDashboard(req: AuthRequest, res: Response) {
  try {
    const [fuelAgg, expenseAgg, tripAgg, maintenanceAgg] = await Promise.all([
      prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.trip.aggregate({ _sum: { revenue: true, actualDistance: true } }),
      prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    ]);

    const totalFuelCost = fuelAgg._sum.cost || 0;
    const totalFuelLiters = fuelAgg._sum.liters || 0;
    const totalExpenses = expenseAgg._sum.amount || 0;
    const totalRevenue = tripAgg._sum.revenue || 0;
    const totalDistance = tripAgg._sum.actualDistance || 0;
    const totalMaintenance = maintenanceAgg._sum.cost || 0;
    const totalOperationalCost = totalFuelCost + totalExpenses + totalMaintenance;
    const roi = totalOperationalCost > 0 ? Math.round(((totalRevenue - totalOperationalCost) / totalOperationalCost) * 100) : 0;

    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyFuel = await prisma.fuelLog.findMany({ where: { date: { gte: sixMonthsAgo } }, orderBy: { date: 'asc' } });
    const monthlyExpenses = await prisma.expense.findMany({ where: { date: { gte: sixMonthsAgo } }, orderBy: { date: 'asc' } });
    const monthlyTrips = await prisma.trip.findMany({ where: { createdAt: { gte: sixMonthsAgo } }, orderBy: { createdAt: 'asc' } });
    const expenseByType = await prisma.expense.groupBy({ by: ['type'], _sum: { amount: true } });

    res.json({
      totalFuelCost, totalFuelLiters, totalExpenses, totalRevenue, totalDistance, totalMaintenance, totalOperationalCost, roi,
      monthlyFuel, monthlyExpenses, monthlyTrips, expenseByType,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
}
