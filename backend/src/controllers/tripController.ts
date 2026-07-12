import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { tripSchema, tripCompletionSchema } from '../utils/validation.js';

export async function getTrips(req: AuthRequest, res: Response) {
  try {
    const { status, vehicleId, driverId, page = '1', limit = '50' } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: { vehicle: { select: { id: true, name: true, registrationNumber: true } }, driver: { select: { id: true, name: true } } },
      }),
      prisma.trip.count({ where }),
    ]);
    res.json({ data: trips, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getTrip(req: AuthRequest, res: Response) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true, driver: true, createdBy: { select: { id: true, name: true, email: true } } },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createTrip(req: AuthRequest, res: Response) {
  try {
    const data = tripSchema.parse(req.body);

    // Validate vehicle exists and is available
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status !== 'AVAILABLE') return res.status(400).json({ error: 'Vehicle is not available for trip' });

    // Validate cargo weight
    if (data.cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({
        error: `Cargo weight (${data.cargoWeight} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacity} kg)`,
      });
    }

    // Validate driver exists and is available
    const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.status !== 'AVAILABLE') return res.status(400).json({ error: 'Driver is not available' });

    // Check license validity
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      return res.status(400).json({ error: 'Driver license has expired' });
    }
    if (driver.status === 'SUSPENDED') {
      return res.status(400).json({ error: 'Driver is suspended' });
    }

    const trip = await prisma.trip.create({
      data: {
        source: data.source,
        destination: data.destination,
        cargoWeight: data.cargoWeight,
        plannedDistance: data.plannedDistance,
        revenue: data.revenue,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        createdById: req.user!.id,
      },
    });

    res.status(201).json(trip);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function updateTripStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, actualDistance, fuelConsumed, finalOdometer, revenue } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    switch (status) {
      case 'DISPATCHED': {
        if (trip.status !== 'DRAFT') return res.status(400).json({ error: 'Only draft trips can be dispatched' });

        // Re-validate vehicle and driver availability
        const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
        const driver = await prisma.driver.findUnique({ where: { id: trip.driverId } });
        if (!vehicle || vehicle.status !== 'AVAILABLE') return res.status(400).json({ error: 'Vehicle is no longer available' });
        if (!driver || driver.status !== 'AVAILABLE') return res.status(400).json({ error: 'Driver is no longer available' });

        await prisma.$transaction([
          prisma.trip.update({ where: { id }, data: { status: 'DISPATCHED' } }),
          prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'ON_TRIP' } }),
          prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'ON_TRIP' } }),
        ]);
        break;
      }
      case 'COMPLETED': {
        if (trip.status !== 'DISPATCHED') return res.status(400).json({ error: 'Only dispatched trips can be completed' });

        const completionData = tripCompletionSchema.parse({ actualDistance, fuelConsumed, finalOdometer, revenue });

        await prisma.$transaction([
          prisma.trip.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              actualDistance: completionData.actualDistance,
              fuelConsumed: completionData.fuelConsumed,
              finalOdometer: completionData.finalOdometer,
              revenue: completionData.revenue ?? trip.revenue,
            },
          }),
          prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE', odometer: completionData.finalOdometer } }),
          prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }),
        ]);
        break;
      }
      case 'CANCELLED': {
        if (trip.status !== 'DISPATCHED' && trip.status !== 'DRAFT') {
          return res.status(400).json({ error: 'Only draft or dispatched trips can be cancelled' });
        }

        await prisma.$transaction([
          prisma.trip.update({ where: { id }, data: { status: 'CANCELLED' } }),
          prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } }),
          prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }),
        ]);
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid status transition' });
    }

    const updated = await prisma.trip.findUnique({
      where: { id },
      include: { vehicle: { select: { id: true, name: true, registrationNumber: true, status: true } }, driver: { select: { id: true, name: true, status: true } } },
    });
    res.json(updated);
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function deleteTrip(req: AuthRequest, res: Response) {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status === 'DISPATCHED') return res.status(400).json({ error: 'Cannot delete a dispatched trip. Cancel it first.' });

    await prisma.trip.delete({ where: { id: req.params.id } });
    res.json({ message: 'Trip deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
