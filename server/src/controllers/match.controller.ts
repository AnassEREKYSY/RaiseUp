import { Request, Response } from 'express';
import { MatchService } from '../services/match.service';

const service = new MatchService();

export class MatchController {
  async getAll(req: Request, res: Response) {
    res.json(await service.getAll());
  }

  async getById(req: Request, res: Response) {
    res.json(await service.getById(req.params.id));
  }

  async create(req: Request, res: Response) {
    res.status(201).json(await service.create(req.body));
  }

  async updateStatus(req: Request, res: Response) {
    res.json(await service.updateStatus(req.params.id, req.body));
  }

  async delete(req: Request, res: Response) {
    await service.delete(req.params.id);
    res.status(204).send();
  }
}
