import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { maintenanceSchema } from '../utils/validation.js';
import { createAuditLog } from '../services/audit.js';
import { createNotification } from '../services/notification.js';

export async function getMaintenanceLogs(req: AuthRequest, res: Response) {
  try {
    const { vehicleId, status, type, priority, page = '1', limit = '50' } = req.query;
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [logs, total] = await Promise.all([
      prisma.maintenanceLog.findMany({
        where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' },
        include: { vehicle: { select: { id: true, name: true, registrationNumber: true, status: true } } },
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
      include: { vehicle: true, auditLogs: true },
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
    if (vehicle.status === 'ON_TRIP') return res.status(400).json({ error: 'Cannot add maintenance to a vehicle on trip' });

    const log = await prisma.$transaction(async (tx) => {
      const mLog = await tx.maintenanceLog.create({
        data: {
          ...data,
          date: new Date(data.date),
          expectedCompletion: data.expectedCompletion ? new Date(data.expectedCompletion) : undefined,
          priority: data.priority || 'Medium',
        },
      });
      await tx.vehicle.update({ where: { id: data.vehicleId }, data: { status: 'IN_SHOP' } });
      return mLog;
    });

    await createAuditLog({ action: 'Maintenance Created', entity: 'MaintenanceLog', entityId: log.id, description: `${data.type} maintenance for ${vehicle.name}`, userId: req.user!.id, vehicleId: data.vehicleId, maintenanceId: log.id });
    await createNotification({ title: 'Maintenance Started', message: `${data.type} maintenance started for ${vehicle.name}`, type: 'warning', module: 'maintenance', link: `/maintenance/${log.id}` });

    res.status(201).json({ ...log, message: 'Vehicle status changed to In Shop' });
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function updateMaintenanceLog(req: AuthRequest, res: Response) {
  try {
    const { status, actualCost, cost, description, type, vendor, completedDate } = req.body;
    const existing = await prisma.maintenanceLog.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true },
    });
    if (!existing) return res.status(404).json({ error: 'Maintenance log not found' });

    if (status === 'CLOSED' && existing.status === 'ACTIVE') {
      await prisma.$transaction(async (tx) => {
        await tx.maintenanceLog.update({
          where: { id: req.params.id },
          data: {
            status: 'CLOSED',
            actualCost: actualCost ?? existing.actualCost,
            cost: cost ?? existing.cost,
            description: description ?? existing.description,
            type: type ?? existing.type,
            vendor: vendor ?? existing.vendor,
            completedDate: completedDate ? new Date(completedDate) : new Date(),
          },
        });
        if (existing.vehicle.status !== 'RETIRED') {
          await tx.vehicle.update({ where: { id: existing.vehicleId }, data: { status: 'AVAILABLE' } });
        }
      });
      await createNotification({ title: 'Maintenance Completed', message: `Maintenance completed for ${existing.vehicle.name}`, type: 'success', module: 'maintenance', link: `/maintenance/${req.params.id}` });
    } else {
      await prisma.maintenanceLog.update({
        where: { id: req.params.id },
        data: { ...(actualCost !== undefined && { actualCost }), ...(cost !== undefined && { cost }), ...(description && { description }), ...(type && { type }), ...(vendor && { vendor }), ...(status && { status }) },
      });
    }

    await createAuditLog({ action: 'Maintenance Updated', entity: 'MaintenanceLog', entityId: req.params.id, description: status === 'CLOSED' ? 'Maintenance closed' : 'Maintenance updated', userId: req.user!.id, vehicleId: existing.vehicleId, maintenanceId: req.params.id });

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
    const existing = await prisma.maintenanceLog.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Maintenance log not found' });
    await prisma.maintenanceLog.delete({ where: { id: req.params.id } });
    res.json({ message: 'Maintenance log deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
