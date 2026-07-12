import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { driverSchema, driverStatusSchema } from '../utils/validation.js';
import { createAuditLog } from '../services/audit.js';
import { createNotification } from '../services/notification.js';

export async function getDrivers(req: AuthRequest, res: Response) {
  try {
    const { search, status } = req.query;
    const where: any = {};

    if (req.user?.role === 'DISPATCHER') {
      where.status = { notIn: ['SUSPENDED', 'INACTIVE', 'ON_TRIP', 'EXPIRED_LICENSE'] };
    }
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { licenseNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const drivers = await prisma.driver.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(drivers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDriver(req: AuthRequest, res: Response) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: {
        trips: { take: 10, orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    res.json({
      ...driver,
      tripCount: driver.trips.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createDriver(req: AuthRequest, res: Response) {
  try {
    const data = driverSchema.parse(req.body);
    const existing = await prisma.driver.findUnique({ where: { licenseNumber: data.licenseNumber } });
    if (existing) return res.status(400).json({ error: 'License number already exists' });

    const driver = await prisma.driver.create({
      data: { ...data, licenseExpiryDate: new Date(data.licenseExpiryDate) },
    });

    await createAuditLog({
      action: 'Driver Created',
      entity: 'Driver',
      entityId: driver.id,
      description: `Driver ${driver.name} created with license ${driver.licenseNumber}`,
      userId: req.user!.id,
      driverId: driver.id,
    });

    res.status(201).json(driver);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function updateDriver(req: AuthRequest, res: Response) {
  try {
    const data = driverSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.licenseExpiryDate) updateData.licenseExpiryDate = new Date(data.licenseExpiryDate);

    if (data.licenseNumber) {
      const existing = await prisma.driver.findFirst({ where: { licenseNumber: data.licenseNumber, NOT: { id: req.params.id } } });
      if (existing) return res.status(400).json({ error: 'License number already in use' });
    }

    const oldDriver = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!oldDriver) return res.status(404).json({ error: 'Driver not found' });

    const driver = await prisma.driver.update({ where: { id: req.params.id }, data: updateData });

    const changes: string[] = [];
    for (const key of Object.keys(data)) {
      if ((oldDriver as any)[key] !== (driver as any)[key]) {
        changes.push(`${key}: ${(oldDriver as any)[key]} -> ${(driver as any)[key]}`);
      }
    }

    await createAuditLog({
      action: 'Driver Updated',
      entity: 'Driver',
      entityId: driver.id,
      description: changes.length > 0 ? changes.join('; ') : 'Driver updated',
      oldValue: oldDriver,
      newValue: driver,
      userId: req.user!.id,
      driverId: driver.id,
    });

    res.json(driver);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function updateDriverStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = driverStatusSchema.parse(req.body);

    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    if (status === 'AVAILABLE' && driver.status === 'ON_TRIP') {
      return res.status(400).json({ error: 'Cannot set driver as AVAILABLE while ON_TRIP' });
    }
    if (status === 'SUSPENDED' && driver.status === 'ON_TRIP') {
      return res.status(400).json({ error: 'Cannot suspend a driver who is ON_TRIP. Cancel trips first.' });
    }

    const oldStatus = driver.status;
    const updated = await prisma.driver.update({ where: { id }, data: { status } });

    if (status === 'SUSPENDED') {
      await createNotification({
        title: 'Driver Suspended',
        message: `Driver ${driver.name} has been suspended`,
        type: 'warning',
        module: 'Driver',
        link: `/drivers/${driver.id}`,
      });
    }
    if (status === 'EXPIRED_LICENSE') {
      await createNotification({
        title: 'Driver License Expired',
        message: `Driver ${driver.name}'s license has expired`,
        type: 'warning',
        module: 'Driver',
        link: `/drivers/${driver.id}`,
      });
    }

    await createAuditLog({
      action: 'Driver Status Changed',
      entity: 'Driver',
      entityId: driver.id,
      description: `Status changed from ${oldStatus} to ${status}`,
      oldValue: { status: oldStatus },
      newValue: { status },
      userId: req.user!.id,
      driverId: driver.id,
    });

    res.json(updated);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function deleteDriver(req: AuthRequest, res: Response) {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const activeTrips = await prisma.trip.count({
      where: { driverId: req.params.id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    });
    if (activeTrips > 0) return res.status(400).json({ error: 'Cannot delete a driver with active trips' });

    await prisma.driver.delete({ where: { id: req.params.id } });
    res.json({ message: 'Driver deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
