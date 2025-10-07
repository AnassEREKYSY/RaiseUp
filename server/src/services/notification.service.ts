import { prisma } from '../prisma';
import { CreateNotificationDto } from '../dtos/notification.dto';

export class NotificationService {
  async getByUser(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: CreateNotificationDto) {
    return prisma.notification.create({ data });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async delete(id: string) {
    return prisma.notification.delete({ where: { id } });
  }
}
