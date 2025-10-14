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

  async getOrCreate(req: Request, res: Response) {
    const meId = (req as any).user?.id;
    const { targetUserId, projectId, investorProfileId } = req.body || {};
    if (!meId || !targetUserId) return res.status(400).json({ message: 'targetUserId required' });

    const match = await service.getOrCreateForUsers({ meId, targetUserId, projectId, investorProfileId });
    res.json(match);
  }

   async request(req: Request, res: Response) {
    const meId = (req as any).user?.id;
    const { targetUserId, projectId, investorProfileId } = req.body || {};
    if (!meId || !targetUserId) return res.status(400).json({ message: 'targetUserId required' });
    const match = await service.requestMatch({ meId, targetUserId, projectId, investorProfileId });
    res.status(201).json(match);
  }

  async accept(req: Request, res: Response) {
    const meId = (req as any).user?.id;
    const { id } = req.params;
    const match = await service.acceptMatch({ meId, matchId: id });
    res.json(match);
  }

  async reject(req: Request, res: Response) {
    const meId = (req as any).user?.id;
    const { id } = req.params;
    await service.rejectMatch({ meId, matchId: id });
    res.status(204).send();
  }

}
