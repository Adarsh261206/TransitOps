import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { driverSchema } from '../utils/validation.js';

export async function getDrivers(req: AuthRequest, res: Response) {
  try {
    const { search, status } = req.query;
    const where: any = {};
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
      include: { trips: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
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

    const driver = await prisma.driver.update({ where: { id: req.params.id }, data: updateData });
    res.json(driver);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function deleteDriver(req: AuthRequest, res: Response) {
  try {
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.json({ message: 'Driver deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
