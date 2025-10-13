import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';

import { prisma } from '../prisma';
import { NotificationService } from '../services/notification.service';

const service = new MessageService();
const notifications = new NotificationService();

export class MessageController {
  async getByMatch(req: Request, res: Response) {
    res.json(await service.getByMatch(req.params.matchId));
  }

  async create(req: Request, res: Response) {
      const senderId = (req as any).user?.id;
      const { matchId, content } = req.body || {};
      if (!senderId || !matchId || !content) return res.status(400).json({ message: 'matchId and content required' });

      const msg = await service.create({ matchId, senderId, content });

      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (match) {
        const recipientId = senderId === match.investorId ? match.startupId : match.investorId;
        await notifications.create({
          userId: recipientId,
          type: 'MESSAGE',
          message: 'New message received',
        } as any);
      }

      res.status(201).json(msg);
  }
}
