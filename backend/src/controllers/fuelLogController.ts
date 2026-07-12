import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { fuelLogSchema } from '../utils/validation.js';
import { createAuditLog } from '../services/audit.js';

export async function getFuelLogs(req: AuthRequest, res: Response) {
  try {
    const { vehicleId, driverId, page = '1', limit = '50' } = req.query;
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [logs, total] = await Promise.all([
      prisma.fuelLog.findMany({
        where, skip, take: parseInt(limit as string), orderBy: { date: 'desc' },
        include: { vehicle: { select: { id: true, name: true, registrationNumber: true } } },
      }),
      prisma.fuelLog.count({ where }),
    ]);
    res.json({ data: logs, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getFuelLog(req: AuthRequest, res: Response) {
  try {
    const log = await prisma.fuelLog.findUnique({ where: { id: req.params.id }, include: { vehicle: true } });
    if (!log) return res.status(404).json({ error: 'Fuel log not found' });
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createFuelLog(req: AuthRequest, res: Response) {
  try {
    const data = fuelLogSchema.parse(req.body);
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Calculate mileage if odometer data available
    const mileage = data.mileage || (data.liters > 0 ? (data.liters / data.liters) : undefined);

    const log = await prisma.fuelLog.create({ data: { ...data, date: new Date(data.date), mileage } });
    
    // Update vehicle fuel average
    const recentLogs = await prisma.fuelLog.findMany({ where: { vehicleId: data.vehicleId }, orderBy: { date: 'desc' }, take: 5 });
    if (recentLogs.length > 0) {
      const avgMileage = recentLogs.filter(l => l.mileage).reduce((s, l) => s + (l.mileage || 0), 0) / recentLogs.filter(l => l.mileage).length;
      await prisma.vehicle.update({ where: { id: data.vehicleId }, data: { fuelAverage: isNaN(avgMileage) ? undefined : avgMileage, lastFuelDate: new Date(data.date) } });
    }

    await createAuditLog({ action: 'Fuel Added', entity: 'FuelLog', entityId: log.id, description: `${data.liters}L fuel for ${vehicle.name}`, userId: req.user!.id, vehicleId: data.vehicleId });

    res.status(201).json(log);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function updateFuelLog(req: AuthRequest, res: Response) {
  try {
    const data = fuelLogSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);
    const log = await prisma.fuelLog.update({ where: { id: req.params.id }, data: updateData });
    res.json(log);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function deleteFuelLog(req: AuthRequest, res: Response) {
  try {
    await prisma.fuelLog.delete({ where: { id: req.params.id } });
    res.json({ message: 'Fuel log deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
