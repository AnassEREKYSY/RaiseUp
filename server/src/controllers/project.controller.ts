import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';

const service = new ProjectService();

export class ProjectController {
  async getAll(req: Request, res: Response) {
    res.json(await service.getAll());
  }

  async getById(req: Request, res: Response) {
    res.json(await service.getById(req.params.id));
  }

  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(400).json({ error: 'Invalid or missing user in token.' });
      }

      const startupProfile = await service.findStartupByUserId(user.id);
      if (!startupProfile) {
        return res.status(404).json({ error: 'Startup profile not found.' });
      }

      const created = await service.create(startupProfile.id, req.body);
      return res.status(201).json(created);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error creating project.' });
    }
  }

  async update(req: Request, res: Response) {
    res.json(await service.update(req.params.id, req.body));
  }

  async delete(req: Request, res: Response) {
    await service.delete(req.params.id);
    res.status(204).send();
  }
}
