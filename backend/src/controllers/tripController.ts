import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';
import { tripSchema, tripStatusSchema, tripCompletionSchema } from '../utils/validation.js';
import { createAuditLog } from '../services/audit.js';
import { createNotification } from '../services/notification.js';
import { sendEmail } from '../services/email.js';
import { tripNotificationTemplate } from '../services/emailTemplates.js';

// Helper: get all fleet managers + safety officers emails for trip notifications
async function getTripNotifyRecipients() {
  return prisma.user.findMany({
    where: { role: { in: ['FLEET_MANAGER', 'DISPATCHER'] }, isVerified: true, status: 'ACTIVE' },
    select: { name: true, email: true },
  });
}

async function sendTripEmails(opts: Parameters<typeof tripNotificationTemplate>[0]) {
  const recipients = await getTripNotifyRecipients();
  for (const r of recipients) {
    sendEmail({
      to: r.email,
      subject: `Trip ${opts.event} — ${opts.source} → ${opts.destination}`,
      html: tripNotificationTemplate({ ...opts, recipientName: r.name }),
      template: `trip_${opts.event.toLowerCase()}`,
      metadata: { tripId: opts.tripId },
    }).catch(() => {});
  }
}

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
      include: {
        vehicle: true,
        driver: true,
        createdBy: { select: { id: true, name: true, email: true } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
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

    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status !== 'AVAILABLE' && vehicle.status !== 'RESERVED') {
      return res.status(400).json({ error: 'Vehicle is not available for trip' });
    }

    if (data.cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({
        error: `Cargo weight (${data.cargoWeight} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacity} kg)`,
      });
    }

    const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.status !== 'AVAILABLE') {
      if (driver.status === 'SUSPENDED') return res.status(400).json({ error: 'Driver is suspended' });
      if (driver.status === 'EXPIRED_LICENSE') return res.status(400).json({ error: 'Driver license has expired' });
      if (driver.status === 'ON_TRIP') return res.status(400).json({ error: 'Driver is currently on another trip' });
      return res.status(400).json({ error: 'Driver is not available' });
    }
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      return res.status(400).json({ error: 'Driver license has expired' });
    }

    const trip = await prisma.trip.create({
      data: {
        source: data.source,
        destination: data.destination,
        cargoWeight: data.cargoWeight,
        goodsType: data.goodsType,
        priority: data.priority,
        plannedDistance: data.plannedDistance,
        estimatedCost: data.estimatedCost,
        estimatedFuel: data.estimatedFuel,
        revenue: data.revenue,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        createdById: req.user!.id,
      },
    });

    const capacityPercent = ((data.cargoWeight / vehicle.maxLoadCapacity) * 100).toFixed(1);
    const warnings: string[] = [];
    if (parseFloat(capacityPercent) > 80) {
      warnings.push(`Cargo load is at ${capacityPercent}% of vehicle capacity`);
    }

    await createAuditLog({
      action: 'Trip Created',
      entity: 'Trip',
      entityId: trip.id,
      description: `Trip from ${trip.source} to ${trip.destination} created`,
      userId: req.user!.id,
      tripId: trip.id,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
    });

    res.status(201).json({
      ...trip,
      warnings,
      capacityPercentage: `${capacityPercent}%`,
    });
  } catch (err: any) {
    if (err.issues) return res.status(400).json({ error: 'Validation error', details: err.issues });
    res.status(500).json({ error: err.message });
  }
}

export async function updateTripStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = tripStatusSchema.parse(req.body);

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    switch (data.status) {
      case 'ASSIGNED': {
        if (trip.status !== 'DRAFT') return res.status(400).json({ error: 'Only draft trips can be assigned' });
        const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
        const driver = await prisma.driver.findUnique({ where: { id: trip.driverId } });
        if (!vehicle || (vehicle.status !== 'AVAILABLE' && vehicle.status !== 'RESERVED')) return res.status(400).json({ error: 'Vehicle is not available' });
        if (!driver || driver.status !== 'AVAILABLE') return res.status(400).json({ error: 'Driver is not available' });

        await prisma.$transaction([
          prisma.trip.update({ where: { id }, data: { status: 'ASSIGNED' } }),
          prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'RESERVED', currentTripId: id, currentDriverId: trip.driverId } }),
          prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'ON_TRIP' } }),
        ]);

        sendTripEmails({ event: 'ASSIGNED', tripId: id, source: trip.source, destination: trip.destination, driverName: trip.driver.name, vehicleName: trip.vehicle.name, vehicleReg: trip.vehicle.registrationNumber, recipientName: '' });
        break;
      }
      case 'DISPATCHED': {
        if (trip.status !== 'ASSIGNED') return res.status(400).json({ error: 'Only assigned trips can be dispatched' });
        await prisma.$transaction([
          prisma.trip.update({ where: { id }, data: { status: 'DISPATCHED' } }),
          prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'ON_TRIP' } }),
        ]);

        // Get dispatcher name
        const dispatcher = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
        sendTripEmails({ event: 'DISPATCHED', tripId: id, source: trip.source, destination: trip.destination, driverName: trip.driver.name, vehicleName: trip.vehicle.name, vehicleReg: trip.vehicle.registrationNumber, dispatchedBy: dispatcher?.name, recipientName: '' });
        break;
      }
      case 'REACHED': {
        if (trip.status !== 'DISPATCHED') return res.status(400).json({ error: 'Only dispatched trips can mark reached' });
        await prisma.trip.update({ where: { id }, data: { status: 'REACHED' } });
        break;
      }
      case 'DELIVERED': {
        if (trip.status !== 'REACHED') return res.status(400).json({ error: 'Only reached trips can be delivered' });
        await prisma.trip.update({ where: { id }, data: { status: 'DELIVERED' } });
        break;
      }
      case 'COMPLETED': {
        if (trip.status !== 'DELIVERED' && trip.status !== 'DISPATCHED') {
          return res.status(400).json({ error: 'Trip must be at least dispatched to complete' });
        }

        const completionData = tripCompletionSchema.parse(data);

        await prisma.$transaction(async (tx) => {
          await tx.trip.update({
            where: { id },
            data: {
              status: 'COMPLETED',
              actualDistance: completionData.actualDistance ?? trip.actualDistance,
              fuelConsumed: completionData.fuelConsumed ?? trip.fuelConsumed,
              finalOdometer: completionData.finalOdometer ?? trip.finalOdometer,
              revenue: completionData.revenue ?? trip.revenue,
              toll: completionData.toll ?? trip.toll,
              expenses: completionData.expenses ?? trip.expenses,
              remarks: completionData.remarks ?? trip.remarks,
            },
          });

          const vehicleUpdateData: any = { status: 'AVAILABLE' };
          if (completionData.finalOdometer) vehicleUpdateData.odometer = completionData.finalOdometer;
          await tx.vehicle.update({ where: { id: trip.vehicleId }, data: vehicleUpdateData });

          await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } });

          if (completionData.toll) {
            await tx.expense.create({
              data: {
                vehicleId: trip.vehicleId,
                type: 'TOLL',
                amount: completionData.toll,
                date: new Date(),
                description: 'Toll for trip',
                tripId: id,
              },
            });
          }
          if (completionData.fuelConsumed) {
            await tx.fuelLog.create({
              data: {
                vehicleId: trip.vehicleId,
                liters: completionData.fuelConsumed,
                cost: 0,
                date: new Date(),
                tripId: id,
                driverId: trip.driverId,
              },
            });
          }
        });

        sendTripEmails({ event: 'COMPLETED', tripId: id, source: trip.source, destination: trip.destination, driverName: trip.driver.name, vehicleName: trip.vehicle.name, vehicleReg: trip.vehicle.registrationNumber, recipientName: '' });
        break;
      }
      case 'CANCELLED': {
        if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
          return res.status(400).json({ error: 'Cannot cancel a completed or already cancelled trip' });
        }
        await prisma.$transaction([
          prisma.trip.update({ where: { id }, data: { status: 'CANCELLED', remarks: data.remarks ?? trip.remarks } }),
          prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE', currentTripId: null, currentDriverId: null } }),
          prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }),
        ]);

        sendTripEmails({ event: 'CANCELLED', tripId: id, source: trip.source, destination: trip.destination, driverName: trip.driver.name, vehicleName: trip.vehicle.name, vehicleReg: trip.vehicle.registrationNumber, remarks: data.remarks, recipientName: '' });
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid status transition' });
    }

    await createAuditLog({
      action: `Trip ${data.status}`,
      entity: 'Trip',
      entityId: id,
      description: `Trip status changed to ${data.status}`,
      userId: req.user!.id,
      tripId: id,
    });

    if (data.status === 'CANCELLED') {
      await createNotification({
        title: 'Trip Cancelled',
        message: `Trip from ${trip.source} to ${trip.destination} has been cancelled`,
        type: 'warning',
        module: 'Trip',
        link: `/trips/${id}`,
      });
    }
    if (data.status === 'COMPLETED') {
      await createNotification({
        title: 'Trip Completed',
        message: `Trip from ${trip.source} to ${trip.destination} has been completed`,
        type: 'success',
        module: 'Trip',
        link: `/trips/${id}`,
      });
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
    if (['DISPATCHED', 'REACHED', 'DELIVERED', 'COMPLETED'].includes(trip.status)) {
      return res.status(400).json({ error: 'Cannot delete a trip that has been dispatched, delivered, or completed' });
    }

    await prisma.trip.delete({ where: { id: req.params.id } });
    res.json({ message: 'Trip deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
