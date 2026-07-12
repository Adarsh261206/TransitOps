import { prisma } from '../index.js';

interface NotificationInput {
  title: string;
  message: string;
  type?: string;
  module?: string;
  link?: string;
  userId?: string;
}

export async function createNotification(data: NotificationInput) {
  return prisma.notification.create({
    data: {
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      module: data.module,
      link: data.link,
      userId: data.userId ?? undefined,
    },
  });
}
