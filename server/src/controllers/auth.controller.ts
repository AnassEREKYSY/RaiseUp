import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthError } from '../errors/auth-error';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err: any) {
      if (err instanceof AuthError) {
        res.status(err.status).json({ error: { code: err.code, message: err.message } });
      } else {
        res.status(400).json({ error: { code: 'BAD_REQUEST', message: err?.message || 'Invalid request' } });
      }
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err: any) {
      if (err instanceof AuthError) {
        res.status(err.status).json({ error: { code: err.code, message: err.message } });
      } else {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: err?.message || 'Unauthorized' } });
      }
    }
  }
}
