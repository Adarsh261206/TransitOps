import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getIncidents(req: AuthRequest, res: Response) {
  try {
    const { status, severity, page = '1', limit = '50' } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [data, total] = await Promise.all([
      prisma.incident.findMany({
        where, skip, take: parseInt(limit as string), orderBy: { date: 'desc' },
        include: {
          vehicle: { select: { id: true, name: true, registrationNumber: true } },
          driver: { select: { id: true, name: true, licenseNumber: true } },
          reportedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.incident.count({ where }),
    ]);
    res.json({ data, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getIncident(req: AuthRequest, res: Response) {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: { select: { id: true, name: true, registrationNumber: true } },
        driver: { select: { id: true, name: true, licenseNumber: true } },
        reportedBy: { select: { id: true, name: true } },
      },
    });
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createIncident(req: AuthRequest, res: Response) {
  try {
    const { title, description, severity, date, location, vehicleId, driverId } = req.body;
    const incident = await prisma.incident.create({
      data: {
        title, description, severity, date: date ? new Date(date) : undefined, location,
        vehicleId: vehicleId || undefined, driverId: driverId || undefined,
        reportedById: req.user!.id,
      },
    });
    res.status(201).json(incident);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateIncident(req: AuthRequest, res: Response) {
  try {
    const { status, severity, resolution, title, description } = req.body;
    const data: any = {};
    if (status) data.status = status;
    if (severity) data.severity = severity;
    if (resolution !== undefined) data.resolution = resolution;
    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (status === 'RESOLVED' || status === 'CLOSED') data.resolvedAt = new Date();

    const incident = await prisma.incident.update({
      where: { id: req.params.id },
      data,
    });
    res.json(incident);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteIncident(req: AuthRequest, res: Response) {
  try {
    await prisma.incident.delete({ where: { id: req.params.id } });
    res.json({ message: 'Incident deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
