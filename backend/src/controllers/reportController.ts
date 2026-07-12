import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getFleetUtilization(req: AuthRequest, res: Response) {
  try {
    const total = await prisma.vehicle.count();
    const onTrip = await prisma.vehicle.count({ where: { status: 'ON_TRIP' } });
    const available = await prisma.vehicle.count({ where: { status: 'AVAILABLE' } });
    const inShop = await prisma.vehicle.count({ where: { status: 'IN_SHOP' } });
    const retired = await prisma.vehicle.count({ where: { status: 'RETIRED' } });

    res.json({
      total,
      onTrip,
      available,
      inShop,
      retired,
      utilizationRate: total > 0 ? Math.round((onTrip / total) * 100) : 0,
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
        vehicleId,
        vehicleName: vehicle?.name || 'Unknown',
        registrationNumber: vehicle?.registrationNumber || '',
        totalDistance: stats.totalDistance,
        totalFuel: stats.totalFuel,
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
    const vehicles = await prisma.vehicle.findMany({
      select: {
        id: true,
        name: true,
        registrationNumber: true,
        fuelLogs: { select: { cost: true } },
        maintenanceLogs: { select: { cost: true } },
      },
    });

    const data = vehicles.map(v => {
      const fuelCost = v.fuelLogs.reduce((sum, l) => sum + l.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((sum, l) => sum + l.cost, 0);
      return {
        vehicleId: v.id,
        vehicleName: v.name,
        registrationNumber: v.registrationNumber,
        fuelCost,
        maintenanceCost,
        totalOperationalCost: fuelCost + maintenanceCost,
      };
    });

    res.json(data);
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
      const roi = v.acquisitionCost > 0
        ? ((totalRevenue - (totalMaintenanceCost + totalFuelCost)) / v.acquisitionCost) * 100
        : 0;

      return {
        vehicleId: v.id,
        vehicleName: v.name,
        registrationNumber: v.registrationNumber,
        acquisitionCost: v.acquisitionCost,
        totalRevenue,
        totalFuelCost,
        totalMaintenanceCost,
        operationalCost: totalFuelCost + totalMaintenanceCost,
        roi: Math.round(roi * 100) / 100,
      };
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getOperationalSummary(req: AuthRequest, res: Response) {
  try {
    const [totalTrips, completedTrips, totalFuelLogs, totalExpenses, vehicleCount] = await Promise.all([
      prisma.trip.count(),
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
      prisma.fuelLog.aggregate({ _sum: { cost: true, liters: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.vehicle.count(),
    ]);

    const maintenanceCost = await prisma.maintenanceLog.aggregate({ _sum: { cost: true } });

    res.json({
      totalTrips,
      completedTrips,
      pendingTrips: totalTrips - completedTrips,
      totalFuelCost: totalFuelLogs._sum.cost || 0,
      totalFuelLiters: totalFuelLogs._sum.liters || 0,
      totalMaintenanceCost: maintenanceCost._sum.cost || 0,
      totalOtherExpenses: totalExpenses._sum.amount || 0,
      totalOperationalCost: (totalFuelLogs._sum.cost || 0) + (maintenanceCost._sum.cost || 0) + (totalExpenses._sum.amount || 0),
      totalVehicles: vehicleCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
