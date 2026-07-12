import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { maintenanceSchema } from '../utils/validation.js';

export async function getMaintenanceLogs(req: AuthRequest, res: Response) {
  try {
    const { vehicleId, status, page = '1', limit = '50' } = req.query;
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (status) where.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [logs, total] = await Promise.all([
      prisma.maintenanceLog.findMany({
        where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' },
        include: { vehicle: { select: { id: true, name: true, registrationNumber: true } } },
      }),
      prisma.maintenanceLog.count({ where }),
    ]);
    res.json({ data: logs, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMaintenanceLog(req: AuthRequest, res: Response) {
  try {
    const log = await prisma.maintenanceLog.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true },
    });
    if (!log) return res.status(404).json({ error: 'Maintenance log not found' });
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createMaintenanceLog(req: AuthRequest, res: Response) {
  try {
    const data = maintenanceSchema.parse(req.body);

    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status === 'RETIRED') return res.status(400).json({ error: 'Cannot add maintenance to a retired vehicle' });

    // Creating maintenance auto-changes vehicle status to IN_SHOP
    const log = await prisma.$transaction(async (tx) => {
      const { expectedCompletion, ...rest } = data;
      const mLog = await tx.maintenanceLog.create({
        data: {
          ...rest,
          date: new Date(rest.date),
          expectedCompletion: expectedCompletion ? new Date(expectedCompletion) : undefined,
        },
      });
      await tx.vehicle.update({ where: { id: data.vehicleId }, data: { status: 'IN_SHOP' } });
      return mLog;
    });

    res.status(201).json({ ...log, message: 'Vehicle status changed to In Shop' });
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function updateMaintenanceLog(req: AuthRequest, res: Response) {
  try {
    const { status, cost, description, type, date } = req.body;
    const existing = await prisma.maintenanceLog.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true },
    });
    if (!existing) return res.status(404).json({ error: 'Maintenance log not found' });

    // Closing maintenance restores vehicle to Available (unless retired)
    if (status === 'CLOSED' && existing.status === 'ACTIVE') {
      await prisma.$transaction(async (tx) => {
        await tx.maintenanceLog.update({
          where: { id: req.params.id },
          data: { status: 'CLOSED', ...(cost !== undefined && { cost }), ...(description && { description }), ...(type && { type }), ...(date && { date: new Date(date) }) },
        });
        if (existing.vehicle.status !== 'RETIRED') {
          await tx.vehicle.update({ where: { id: existing.vehicleId }, data: { status: 'AVAILABLE' } });
        }
      });
    } else {
      await prisma.maintenanceLog.update({
        where: { id: req.params.id },
        data: { ...(cost !== undefined && { cost }), ...(description && { description }), ...(type && { type }), ...(status && { status }), ...(date && { date: new Date(date) }) },
      });
    }

    const updated = await prisma.maintenanceLog.findUnique({
      where: { id: req.params.id },
      include: { vehicle: { select: { id: true, name: true, registrationNumber: true, status: true } } },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteMaintenanceLog(req: AuthRequest, res: Response) {
  try {
    await prisma.maintenanceLog.delete({ where: { id: req.params.id } });
    res.json({ message: 'Maintenance log deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
