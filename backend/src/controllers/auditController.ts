import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const { entity, entityId, action, page = '1', limit = '50' } = req.query;
    const where: any = {};
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, skip, take: parseInt(limit as string), orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ data: logs, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getEntityTimeline(req: AuthRequest, res: Response) {
  try {
    const { entity, entityId } = req.params;
    const logs = await prisma.auditLog.findMany({
      where: { entity: entity.toUpperCase(), entityId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { name: true } } },
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
