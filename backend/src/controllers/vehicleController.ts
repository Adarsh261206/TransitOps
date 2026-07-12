import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { vehicleSchema } from '../utils/validation.js';

export async function getVehicles(req: AuthRequest, res: Response) {
  try {
    const { search, status, type, region, page = '1', limit = '50' } = req.query;
    const where: any = {};
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
      include: { trips: { take: 10, orderBy: { createdAt: 'desc' } }, maintenanceLogs: true, fuelLogs: true, expenses: true },
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
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : undefined,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : undefined,
        pucExpiry: pucExpiry ? new Date(pucExpiry) : undefined,
      },
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
    const { acquisitionDate, insuranceExpiry, pucExpiry, ...rest } = data;
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        acquisitionDate: acquisitionDate !== undefined ? new Date(acquisitionDate) : undefined,
        insuranceExpiry: insuranceExpiry !== undefined ? new Date(insuranceExpiry) : undefined,
        pucExpiry: pucExpiry !== undefined ? new Date(pucExpiry) : undefined,
      },
    });
    res.json(vehicle);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function deleteVehicle(req: AuthRequest, res: Response) {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ message: 'Vehicle deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
