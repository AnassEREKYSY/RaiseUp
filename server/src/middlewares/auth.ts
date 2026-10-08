import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export type TokenUser = { id: string; role: 'STARTUP' | 'INVESTOR' | 'ADMIN' };

export const signToken = (u: TokenUser) => jwt.sign({ id: u.id, role: u.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
export const verifyToken = (token: string) => jwt.verify(token, config.jwtSecret) as TokenUser;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  const token = h?.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sign in required' });
  try {
    const u = verifyToken(token);
    (req as any).user = { id: u.id, role: u.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired' });
  }
}

export const requireRole = (...roles: TokenUser['role'][]) => (req: Request, res: Response, next: NextFunction) =>
  roles.includes((req as any).user?.role) ? next() : res.status(403).json({ error: 'Not available for your account type' });
