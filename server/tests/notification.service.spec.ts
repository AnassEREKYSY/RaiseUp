import { NotificationService } from '../src/services/notification.service';
import { prisma } from '../src/prisma';

jest.mock('../src/prisma', () => ({
  prisma: {
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));


describe('NotificationService', () => {
  const service = new NotificationService();

  beforeEach(() => jest.clearAllMocks());

  it('getByUser queries by userId and orders desc', async () => {
    (prisma.notification.findMany as jest.Mock).mockResolvedValue([{ id: 'n1' }]);

    const res = await service.getByUser('u1');

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(res).toEqual([{ id: 'n1' }]);
  });

  it('create inserts provided data', async () => {
    (prisma.notification.create as jest.Mock).mockResolvedValue({
      id: 'n2',
      userId: 'u1',
      type: 'MESSAGE',
      message: 'Hello',
      isRead: false,
    });

    const payload = { userId: 'u1', type: 'MESSAGE', message: 'Hello', isRead: false } as any;
    const res = await service.create(payload);

    expect(prisma.notification.create).toHaveBeenCalledWith({ data: payload });
    expect(res.id).toBe('n2');
  });

  it('markAsRead sets isRead=true', async () => {
    (prisma.notification.update as jest.Mock).mockResolvedValue({ id: 'n3', isRead: true });

    const res = await service.markAsRead('n3');

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'n3' },
      data: { isRead: true },
    });
    expect(res).toEqual({ id: 'n3', isRead: true });
  });

  it('delete removes by id', async () => {
    (prisma.notification.delete as jest.Mock).mockResolvedValue({ id: 'n4' });

    const res = await service.delete('n4');

    expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'n4' } });
    expect(res).toEqual({ id: 'n4' });
  });
});
