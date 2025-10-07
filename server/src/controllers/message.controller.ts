import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';

const service = new MessageService();

export class MessageController {
  async getByMatch(req: Request, res: Response) {
    res.json(await service.getByMatch(req.params.matchId));
  }

  async create(req: Request, res: Response) {
    res.status(201).json(await service.create(req.body));
  }
}
