import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { vehicleSchema, vehicleStatusSchema } from '../utils/validation.js';
import { createAuditLog } from '../services/audit.js';
import { createNotification } from '../services/notification.js';

export async function getVehicles(req: AuthRequest, res: Response) {
  try {
    const { search, status, type, region, page = '1', limit = '50' } = req.query;
    const where: any = {};

    if (req.user?.role === 'DISPATCHER') {
      where.status = { notIn: ['IN_SHOP', 'RETIRED', 'INACTIVE'] };
    }
    if (status) where.status = status;
    if (type) where.type = type;
    if (region) where.region = region;
    if (search) {
      where.OR = [
        { registrationNumber: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({ where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' } }),
      prisma.vehicle.count({ where }),
    ]);
    res.json({ data: vehicles, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getVehicle(req: AuthRequest, res: Response) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        trips: { take: 10, orderBy: { createdAt: 'desc' } },
        maintenanceLogs: true,
        fuelLogs: true,
        expenses: true,
        documents: true,
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createVehicle(req: AuthRequest, res: Response) {
  try {
    const data = vehicleSchema.parse(req.body);
    const existing = await prisma.vehicle.findUnique({ where: { registrationNumber: data.registrationNumber } });
    if (existing) return res.status(400).json({ error: 'Registration number already exists' });

    const { acquisitionDate, insuranceExpiry, pucExpiry, ...rest } = data;
    const vehicle = await prisma.vehicle.create({
      data: {
        ...rest,
        acquisitionDate: acquisitionDate && typeof acquisitionDate === 'string' ? new Date(acquisitionDate) : undefined,
        insuranceExpiry: insuranceExpiry && typeof insuranceExpiry === 'string' ? new Date(insuranceExpiry) : undefined,
        pucExpiry: pucExpiry && typeof pucExpiry === 'string' ? new Date(pucExpiry) : undefined,
      },
    });

    await createAuditLog({
      action: 'Vehicle Created',
      entity: 'Vehicle',
      entityId: vehicle.id,
      description: `Vehicle ${vehicle.registrationNumber} created`,
      userId: req.user!.id,
      vehicleId: vehicle.id,
    });

    res.status(201).json(vehicle);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function updateVehicle(req: AuthRequest, res: Response) {
  try {
    const data = vehicleSchema.partial().parse(req.body);
    if (data.registrationNumber) {
      const existing = await prisma.vehicle.findFirst({ where: { registrationNumber: data.registrationNumber, NOT: { id: req.params.id } } });
      if (existing) return res.status(400).json({ error: 'Registration number already in use' });
    }

    const oldVehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!oldVehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const { acquisitionDate, insuranceExpiry, pucExpiry, ...rest } = data;
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        acquisitionDate: acquisitionDate && typeof acquisitionDate === 'string' ? new Date(acquisitionDate) : undefined,
        insuranceExpiry: insuranceExpiry && typeof insuranceExpiry === 'string' ? new Date(insuranceExpiry) : undefined,
        pucExpiry: pucExpiry && typeof pucExpiry === 'string' ? new Date(pucExpiry) : undefined,
      },
    });

    const changes: string[] = [];
    for (const key of Object.keys(data)) {
      if (key === 'acquisitionDate' || key === 'insuranceExpiry' || key === 'pucExpiry') continue;
      if ((oldVehicle as any)[key] !== (vehicle as any)[key]) {
        changes.push(`${key}: ${(oldVehicle as any)[key]} -> ${(vehicle as any)[key]}`);
      }
    }

    if (data.status && data.status !== oldVehicle.status) {
      if (data.status === 'IN_SHOP') {
        await createNotification({
          title: 'Vehicle in Shop',
          message: `Vehicle ${vehicle.registrationNumber} (${vehicle.name}) is now in maintenance shop`,
          type: 'warning',
          module: 'Vehicle',
          link: `/vehicles/${vehicle.id}`,
        });
      }
      if (data.status === 'RETIRED') {
        await createNotification({
          title: 'Vehicle Retired',
          message: `Vehicle ${vehicle.registrationNumber} (${vehicle.name}) has been retired`,
          type: 'info',
          module: 'Vehicle',
          link: `/vehicles/${vehicle.id}`,
        });
      }
    }

    await createAuditLog({
      action: 'Vehicle Updated',
      entity: 'Vehicle',
      entityId: vehicle.id,
      description: changes.length > 0 ? changes.join('; ') : 'Vehicle updated',
      oldValue: oldVehicle,
      newValue: vehicle,
      userId: req.user!.id,
      vehicleId: vehicle.id,
    });

    res.json(vehicle);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function updateVehicleStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = vehicleStatusSchema.parse(req.body);

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    if (status === 'AVAILABLE' && vehicle.status === 'ON_TRIP') {
      return res.status(400).json({ error: 'Cannot set vehicle as AVAILABLE while it is ON_TRIP' });
    }
    if (status === 'RETIRED' && vehicle.status === 'ON_TRIP') {
      return res.status(400).json({ error: 'Cannot retire a vehicle that is currently ON_TRIP' });
    }
    if (status === 'IN_SHOP' && vehicle.status === 'RETIRED') {
      return res.status(400).json({ error: 'Cannot move a retired vehicle to IN_SHOP' });
    }
    if (status === 'IN_SHOP') {
      const activeTrips = await prisma.trip.count({
        where: { vehicleId: id, status: { in: ['ASSIGNED', 'DISPATCHED', 'REACHED', 'DELIVERED'] } },
      });
      if (activeTrips > 0) {
        return res.status(400).json({ error: 'Cannot set IN_SHOP while vehicle has active trips' });
      }
    }

    const oldStatus = vehicle.status;
    const updated = await prisma.vehicle.update({ where: { id }, data: { status } });

    if (status === 'RETIRED') {
      await createNotification({
        title: 'Vehicle Retired',
        message: `Vehicle ${vehicle.registrationNumber} (${vehicle.name}) has been retired`,
        type: 'info',
        module: 'Vehicle',
        link: `/vehicles/${vehicle.id}`,
      });
    }
    if (status === 'IN_SHOP') {
      await createNotification({
        title: 'Vehicle in Shop',
        message: `Vehicle ${vehicle.registrationNumber} (${vehicle.name}) is now in maintenance shop`,
        type: 'warning',
        module: 'Vehicle',
        link: `/vehicles/${vehicle.id}`,
      });
    }

    await createAuditLog({
      action: 'Vehicle Status Changed',
      entity: 'Vehicle',
      entityId: vehicle.id,
      description: `Status changed from ${oldStatus} to ${status}`,
      oldValue: { status: oldStatus },
      newValue: { status },
      userId: req.user!.id,
      vehicleId: vehicle.id,
    });

    res.json(updated);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function deleteVehicle(req: AuthRequest, res: Response) {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status === 'ON_TRIP') return res.status(400).json({ error: 'Cannot delete a vehicle that is currently ON_TRIP' });

    const activeTrips = await prisma.trip.count({
      where: { vehicleId: req.params.id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    });
    if (activeTrips > 0) return res.status(400).json({ error: 'Cannot delete a vehicle with active trips' });

    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ message: 'Vehicle deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
