import { prisma } from '../index.js';

interface AuditInput {
  action: string;
  entity: string;
  entityId?: string;
  description?: string;
  oldValue?: any;
  newValue?: any;
  userId?: string;
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  maintenanceId?: string;
}

export async function createAuditLog(data: AuditInput) {
  return prisma.auditLog.create({
    data: {
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      description: data.description,
      oldValue: data.oldValue ?? undefined,
      newValue: data.newValue ?? undefined,
      userId: data.userId ?? undefined,
      vehicleId: data.vehicleId ?? undefined,
      driverId: data.driverId ?? undefined,
      tripId: data.tripId ?? undefined,
      maintenanceId: data.maintenanceId ?? undefined,
    },
  });
}
