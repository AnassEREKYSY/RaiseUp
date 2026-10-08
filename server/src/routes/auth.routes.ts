import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { HttpError, handle, parse, userId } from '../lib/http';
import { requireAuth, signToken } from '../middlewares/auth';
import { prisma } from '../prisma';
import { me } from '../services/me.service';

const r = Router();

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'at least 8 characters').max(200),
  fullName: z.string().trim().min(2).max(100),
  role: z.enum(['STARTUP', 'INVESTOR']),
});
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

r.post('/register', handle(async (req, res) => {
  const body = parse(registerSchema, req.body);
  const exists = await prisma.user.findFirst({ where: { email: { equals: body.email, mode: 'insensitive' } } });
  if (exists) throw new HttpError(409, 'An account already exists with this email.', 'EMAIL_TAKEN');
  const user = await prisma.user.create({
    data: { email: body.email, fullName: body.fullName, role: body.role, password: await bcrypt.hash(body.password, 10) },
  });
  res.status(201).json({ token: signToken(user as any), user: await me(user.id) });
}));

r.post('/login', handle(async (req, res) => {
  const body = parse(loginSchema, req.body);
  const user = await prisma.user.findFirst({ where: { email: { equals: body.email, mode: 'insensitive' } } });
  // Same message for unknown email and wrong password.
  if (!user || !(await bcrypt.compare(body.password, user.password))) throw new HttpError(401, 'Email or password is incorrect.', 'BAD_CREDENTIALS');
  res.json({ token: signToken(user as any), user: await me(user.id) });
}));

r.get('/me', requireAuth, handle(async (req, res) => {
  const u = await me(userId(req));
  if (!u) throw new HttpError(401, 'Session expired');
  res.json({ user: u });
}));

export default r;
