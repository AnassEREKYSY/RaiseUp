import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

const service = new NotificationService();

export class NotificationController {
  async getByUser(req: Request, res: Response) {
    res.json(await service.getByUser(req.params.userId));
  }

  async create(req: Request, res: Response) {
    res.status(201).json(await service.create(req.body));
  }

  async markAsRead(req: Request, res: Response) {
    res.json(await service.markAsRead(req.params.id));
  }

  async delete(req: Request, res: Response) {
    await service.delete(req.params.id);
    res.status(204).send();
  }
}
