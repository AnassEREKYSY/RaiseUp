import { MessageService } from '../src/services/message.service';
import { prisma } from '../src/prisma';

jest.mock('../src/prisma', () => ({
  prisma: {
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));


describe('MessageService', () => {
  const service = new MessageService();

  beforeEach(() => jest.clearAllMocks());

  it('getByMatch queries by matchId, ordered asc, includes sender', async () => {
    (prisma.message.findMany as jest.Mock).mockResolvedValue([{ id: 'msg1' }]);

    const res = await service.getByMatch('m1');

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: { matchId: 'm1' },
      orderBy: { createdAt: 'asc' },
      include: { sender: true },
    });
    expect(res).toEqual([{ id: 'msg1' }]);
  });

  it('create inserts matchId, senderId, content', async () => {
    (prisma.message.create as jest.Mock).mockResolvedValue({
      id: 'msg2',
      matchId: 'm1',
      senderId: 'u1',
      content: 'hello',
    });

    const res = await service.create({ matchId: 'm1', senderId: 'u1', content: 'hello' });

    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { matchId: 'm1', senderId: 'u1', content: 'hello' },
    });
    expect(res).toEqual({ id: 'msg2', matchId: 'm1', senderId: 'u1', content: 'hello' });
  });
});
