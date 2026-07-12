import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthRequest } from '../middleware/auth.js';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { OR: [{ userId: req.user!.id }, { userId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function markAsRead(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json({ message: 'Marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response) {
  try {
    await prisma.notification.updateMany({
      where: { OR: [{ userId: req.user!.id }, { userId: null }], read: false },
      data: { read: true },
    });
    res.json({ message: 'All marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response) {
  try {
    const count = await prisma.notification.count({
      where: { OR: [{ userId: req.user!.id }, { userId: null }], read: false },
    });
    res.json({ count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
