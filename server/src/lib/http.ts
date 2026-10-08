import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}
export const notFound = (what = 'Not found') => new HttpError(404, what);
export const forbidden = (what = 'Forbidden') => new HttpError(403, what);
export const badRequest = (what: string) => new HttpError(400, what);

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;
/** Express 5 forwards rejected promises, this only keeps handlers short. */
export const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function parse<T>(schema: ZodSchema<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    const first = r.error.issues[0];
    throw new HttpError(400, first ? `${first.path.join('.') || 'body'}: ${first.message}` : 'Invalid input', 'VALIDATION');
  }
  return r.data;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code });
  if (err instanceof ZodError) return res.status(400).json({ error: 'Invalid input' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  console.error('[api]', err);
  return res.status(500).json({ error: 'Server error' });
}

export const userId = (req: Request) => (req as any).user.id as string;
export const userRole = (req: Request) => (req as any).user.role as 'STARTUP' | 'INVESTOR' | 'ADMIN';
