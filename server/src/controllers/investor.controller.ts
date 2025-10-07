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
         res.status(201).json(await service.create(req.body.userId, req.body)); 
    }

    async update(req: Request, res: Response) {
         res.json(await service.update(req.params.id, req.body)); 
    }

    async delete(req: Request, res: Response) {
         await service.delete(req.params.id); res.status(204).send(); 
    }
}
