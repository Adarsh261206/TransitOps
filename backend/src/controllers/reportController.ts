import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getFleetUtilization(req: AuthRequest, res: Response) {
  try {
    const total = await prisma.vehicle.count();
    const onTrip = await prisma.vehicle.count({ where: { status: 'ON_TRIP' } });
    const available = await prisma.vehicle.count({ where: { status: 'AVAILABLE' } });
    const inShop = await prisma.vehicle.count({ where: { status: 'IN_SHOP' } });
    const reserved = await prisma.vehicle.count({ where: { status: 'RESERVED' } });
    const inactive = await prisma.vehicle.count({ where: { status: 'INACTIVE' } });
    const retired = await prisma.vehicle.count({ where: { status: 'RETIRED' } });

    const totalDrivers = await prisma.driver.count();
    const availableDrivers = await prisma.driver.count({ where: { status: 'AVAILABLE' } });
    const activeTrips = await prisma.trip.count({ where: { status: { in: ['DISPATCHED', 'ASSIGNED', 'REACHED', 'DELIVERED'] } } });
    const monthlyTrips = await prisma.trip.count({ where: { createdAt: { gte: new Date(new Date().setDate(1)) } } });

    res.json({
      total, onTrip, available, inShop, reserved, inactive, retired,
      utilizationRate: total > 0 ? Math.round(((onTrip + reserved) / total) * 100) : 0,
      totalDrivers, availableDrivers, activeTrips, monthlyTrips,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getFuelEfficiency(req: AuthRequest, res: Response) {
  try {
    const completedTrips = await prisma.trip.findMany({
      where: { status: 'COMPLETED', actualDistance: { not: null }, fuelConsumed: { not: null } },
      select: { id: true, vehicleId: true, actualDistance: true, fuelConsumed: true },
    });

    const efficiencyMap = new Map<string, { totalDistance: number; totalFuel: number; vehicleName: string }>();
    for (const trip of completedTrips) {
      const existing = efficiencyMap.get(trip.vehicleId) || { totalDistance: 0, totalFuel: 0, vehicleName: '' };
      existing.totalDistance += trip.actualDistance || 0;
      existing.totalFuel += trip.fuelConsumed || 0;
      efficiencyMap.set(trip.vehicleId, existing);
    }

    const vehicles = await prisma.vehicle.findMany({ select: { id: true, name: true, registrationNumber: true } });
    const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

    const data = Array.from(efficiencyMap.entries()).map(([vehicleId, stats]) => {
      const vehicle = vehicleMap.get(vehicleId);
      return {
        vehicleId, vehicleName: vehicle?.name || 'Unknown', registrationNumber: vehicle?.registrationNumber || '',
        totalDistance: stats.totalDistance, totalFuel: stats.totalFuel,
        efficiency: stats.totalFuel > 0 ? (stats.totalDistance / stats.totalFuel).toFixed(2) : '0',
      };
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getOperationalCost(req: AuthRequest, res: Response) {
  try {
    const [fuelAgg, maintenanceAgg, expenseAgg, tripAgg] = await Promise.all([
      prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
      prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.trip.aggregate({ _sum: { revenue: true, actualDistance: true } }),
    ]);

    const totalFuelCost = fuelAgg._sum.cost || 0;
    const totalFuelLiters = fuelAgg._sum.liters || 0;
    const totalMaintenanceCost = maintenanceAgg._sum.cost || 0;
    const totalOtherExpenses = expenseAgg._sum.amount || 0;
    const totalRevenue = tripAgg._sum.revenue || 0;
    const totalDistance = tripAgg._sum.actualDistance || 0;
    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;

    // Vehicle-level breakdown
    const vehicles = await prisma.vehicle.findMany({
      select: {
        id: true, name: true, registrationNumber: true,
        fuelLogs: { select: { cost: true } },
        maintenanceLogs: { select: { cost: true } },
        expenses: { select: { amount: true } },
        trips: { where: { status: 'COMPLETED' }, select: { revenue: true } },
      },
    });

    const vehicleCosts = vehicles.map(v => ({
      vehicleId: v.id, vehicleName: v.name, registrationNumber: v.registrationNumber,
      fuelCost: v.fuelLogs.reduce((s, l) => s + l.cost, 0),
      maintenanceCost: v.maintenanceLogs.reduce((s, l) => s + l.cost, 0),
      otherExpenses: v.expenses.reduce((s, e) => s + e.amount, 0),
      totalRevenue: v.trips.reduce((s, t) => s + (t.revenue || 0), 0),
      totalOperationalCost: v.fuelLogs.reduce((s, l) => s + l.cost, 0) + v.maintenanceLogs.reduce((s, l) => s + l.cost, 0) + v.expenses.reduce((s, e) => s + e.amount, 0),
    }));

    res.json({ totalFuelCost, totalFuelLiters, totalMaintenanceCost, totalOtherExpenses, totalRevenue, totalDistance, totalOperationalCost, vehicleCosts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getVehicleROI(req: AuthRequest, res: Response) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: { where: { status: 'COMPLETED' }, select: { revenue: true } },
        fuelLogs: { select: { cost: true } },
        maintenanceLogs: { select: { cost: true } },
      },
    });

    const data = vehicles.map(v => {
      const totalRevenue = v.trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      const totalFuelCost = v.fuelLogs.reduce((sum, l) => sum + l.cost, 0);
      const totalMaintenanceCost = v.maintenanceLogs.reduce((sum, l) => sum + l.cost, 0);
      const operationalCost = totalFuelCost + totalMaintenanceCost;
      const roi = v.acquisitionCost > 0 ? ((totalRevenue - operationalCost) / v.acquisitionCost) * 100 : 0;

      return {
        vehicleId: v.id, vehicleName: v.name, registrationNumber: v.registrationNumber,
        acquisitionCost: v.acquisitionCost, totalRevenue, totalFuelCost, totalMaintenanceCost, operationalCost,
        roi: Math.round(roi * 100) / 100,
        profitLoss: totalRevenue - operationalCost,
      };
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getOperationalSummary(req: AuthRequest, res: Response) {
  try {
    const [totalTrips, completedTrips, activeTrips, totalFuelLogs, totalExpenses, vehicleCount, driverCount] = await Promise.all([
      prisma.trip.count(),
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
      prisma.trip.count({ where: { status: { in: ['DISPATCHED', 'ASSIGNED', 'REACHED', 'DELIVERED'] } } }),
      prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.vehicle.count(),
      prisma.driver.count(),
    ]);

    const maintenanceCost = await prisma.maintenanceLog.aggregate({ _sum: { cost: true } });
    const totalRevenue = await prisma.trip.aggregate({ _sum: { revenue: true } });

    res.json({
      totalTrips, completedTrips, activeTrips, pendingTrips: totalTrips - completedTrips,
      totalFuelCost: totalFuelLogs._sum.cost || 0, totalFuelLiters: totalFuelLogs._sum.liters || 0,
      totalMaintenanceCost: maintenanceCost._sum.cost || 0,
      totalOtherExpenses: totalExpenses._sum.amount || 0,
      totalRevenue: totalRevenue._sum.revenue || 0,
      totalOperationalCost: (totalFuelLogs._sum.cost || 0) + (maintenanceCost._sum.cost || 0) + (totalExpenses._sum.amount || 0),
      totalVehicles: vehicleCount, totalDrivers: driverCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDriverPerformance(req: AuthRequest, res: Response) {
  try {
    const drivers = await prisma.driver.findMany({
      include: {
        trips: { where: { status: 'COMPLETED' }, select: { revenue: true, actualDistance: true, fuelConsumed: true } },
        _count: { select: { trips: true } },
      },
      orderBy: { safetyScore: 'desc' },
    });

    const data = drivers.map(d => ({
      id: d.id, name: d.name, safetyScore: d.safetyScore, averageRating: d.averageRating, totalTrips: d.totalTrips,
      totalDistance: d.totalDistance, violations: d.violations, status: d.status,
      totalRevenue: d.trips.reduce((s, t) => s + (t.revenue || 0), 0),
      fuelEfficiency: d.fuelEfficiency,
    }));

    const topDrivers = [...data].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 5);
    const worstDrivers = [...data].sort((a, b) => a.safetyScore - b.safetyScore).slice(0, 5);

    res.json({ drivers: data, topDrivers, worstDrivers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getTrends(req: AuthRequest, res: Response) {
  try {
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyFuel = await prisma.fuelLog.findMany({
      where: { date: { gte: sixMonthsAgo } },
      orderBy: { date: 'asc' },
      select: { date: true, cost: true, liters: true },
    });

    const monthlyExpenses = await prisma.expense.findMany({
      where: { date: { gte: sixMonthsAgo } },
      orderBy: { date: 'asc' },
      select: { date: true, amount: true, type: true },
    });

    const monthlyTrips = await prisma.trip.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, status: true, revenue: true },
    });

    res.json({ monthlyFuel, monthlyExpenses, monthlyTrips });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
