import { Request, Response } from 'express';
import { StartupService } from '../services/startup.service';

const service = new StartupService();

export class StartupController {
  async getAll(req: Request, res: Response) {
    res.json(await service.getAll());
  }

  async getById(req: Request, res: Response) {
    res.json(await service.getById(req.params.id));
  }

  async create(req: Request, res: Response) {
    const userId = req.body.userId;
    res.status(201).json(await service.create(userId, req.body));
  }

  async update(req: Request, res: Response) {
    res.json(await service.update(req.params.id, req.body));
  }

  async delete(req: Request, res: Response) {
    await service.delete(req.params.id);
    res.status(204).send();
  }
}
