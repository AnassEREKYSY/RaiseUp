import { Request, Response } from 'express';
import { InvestorService } from '../services/investor.service';

const service = new InvestorService();

export class InvestorController {
    
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

        const created = await service.create(user.id, req.body);
        return res.status(201).json({ ...created, hasProfile: true });
        } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error creating investor profile.' });
        }
    }

    async update(req: Request, res: Response) {
         res.json(await service.update(req.params.id, req.body)); 
    }

    async delete(req: Request, res: Response) {
         await service.delete(req.params.id); res.status(204).send(); 
    }

    async search(req: Request, res: Response) {
        const { industry, stagePreference, location, createdAt } = req.query;
        const results = await service.search({
            industry: industry as any,
            stagePreference: stagePreference as any,
            location: location as string,
            createdAt: createdAt as string,
        });
        res.json(results);
    }
}
