import { prisma } from '../prisma';
import { CreateMessageDto } from '../dtos/message.dto';

export class MessageService {
  async getByMatch(matchId: string) {
    return prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
      include: { sender: true }
    });
  }

  async create(data: CreateMessageDto) {
    return prisma.message.create({
      data: {
        matchId: data.matchId,
        senderId: data.senderId,
        content: data.content
      }
    });
  }
}
