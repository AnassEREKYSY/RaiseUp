import { Router } from 'express';
import { z } from 'zod';
import { forbidden, handle, notFound, parse, userId, userRole } from '../lib/http';
import { prisma } from '../prisma';
import { me } from '../services/me.service';

const r = Router();
const INDUSTRIES = ['FINTECH', 'HEALTHCARE', 'EDUCATION', 'ECOMMERCE', 'AI', 'BLOCKCHAIN', 'GREEN_TECH', 'LOGISTICS', 'AGRITECH', 'OTHER'] as const;
const STAGES = ['IDEA', 'MVP', 'GROWTH', 'SCALE', 'EXIT'] as const;
const url = z.string().trim().max(300).url().or(z.literal('')).nullish().transform(v => v || null);
const text = (max: number) => z.string().trim().max(max).nullish().transform(v => v || null);
const money = z.number().nonnegative().max(1e12).nullish();

const startupSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  tagline: text(140),
  description: text(4000),
  industry: z.enum(INDUSTRIES),
  stage: z.enum(STAGES),
  fundingNeeded: money,
  amountRaised: money,
  teamSize: z.number().int().min(1).max(100000).nullish(),
  foundedYear: z.number().int().min(1900).max(2100).nullish(),
  monthlyRevenue: money,
  monthlyGrowth: z.number().min(-100).max(10000).nullish(),
  customers: z.number().int().nonnegative().nullish(),
  website: url,
  country: text(80),
  traction: text(2000),
  pitchDeckUrl: url,
});

const investorSchema = z.object({
  companyName: text(120),
  investorType: z.enum(['ANGEL', 'VC', 'CORPORATE', 'FAMILY_OFFICE', 'ACCELERATOR']).nullish(),
  bio: text(4000),
  industries: z.array(z.enum(INDUSTRIES)).max(10).default([]),
  stagePreference: z.array(z.enum(STAGES)).max(5).default([]),
  location: text(80),
  minTicket: money,
  maxTicket: money,
  portfolioCount: z.number().int().nonnegative().max(100000).nullish(),
  website: url,
}).refine(v => v.minTicket == null || v.maxTicket == null || v.minTicket <= v.maxTicket, { message: 'minimum ticket is above maximum', path: ['minTicket'] });

const userSchema = z.object({ fullName: z.string().trim().min(2).max(100).optional(), avatarUrl: url.optional() });

const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(4000),
  fundingGoal: money,
  industry: z.enum(INDUSTRIES),
});

r.get('/', handle(async (req, res) => res.json({ user: await me(userId(req)) })));

r.patch('/', handle(async (req, res) => {
  const data = parse(userSchema, req.body);
  await prisma.user.update({ where: { id: userId(req) }, data });
  res.json({ user: await me(userId(req)) });
}));

// Create or update the profile that matches the account type (used by onboarding and the profile page).
r.put('/profile', handle(async (req, res) => {
  const id = userId(req);
  if (userRole(req) === 'STARTUP') {
    const data = parse(startupSchema, req.body);
    await prisma.startupProfile.upsert({ where: { userId: id }, create: { ...data, userId: id }, update: data });
  } else if (userRole(req) === 'INVESTOR') {
    const data = parse(investorSchema, req.body);
    // Keep the legacy free-text range readable by older data consumers.
    const investmentRange = data.minTicket != null || data.maxTicket != null ? `${data.minTicket ?? 0}-${data.maxTicket ?? ''}` : undefined;
    await prisma.investorProfile.upsert({
      where: { userId: id },
      create: { ...data, userId: id, ...(investmentRange ? { investmentRange } : {}) },
      update: { ...data, ...(investmentRange ? { investmentRange } : {}) },
    });
  } else throw forbidden();
  res.json({ user: await me(id) });
}));

async function myStartupId(req: any) {
  const s = await prisma.startupProfile.findUnique({ where: { userId: userId(req) }, select: { id: true } });
  if (!s) throw forbidden('Create your startup profile first');
  return s.id;
}

r.post('/projects', handle(async (req, res) => {
  const startupId = await myStartupId(req);
  const p = await prisma.project.create({ data: { ...parse(projectSchema, req.body), startupId } });
  res.status(201).json(p);
}));

r.put('/projects/:id', handle(async (req, res) => {
  const startupId = await myStartupId(req);
  const found = await prisma.project.findFirst({ where: { id: String(req.params.id), startupId } });
  if (!found) throw notFound('Project not found');
  res.json(await prisma.project.update({ where: { id: found.id }, data: parse(projectSchema, req.body) }));
}));

r.delete('/projects/:id', handle(async (req, res) => {
  const startupId = await myStartupId(req);
  const found = await prisma.project.findFirst({ where: { id: String(req.params.id), startupId }, include: { _count: { select: { matches: true } } } });
  if (!found) throw notFound('Project not found');
  if (found._count.matches) await prisma.match.updateMany({ where: { projectId: found.id }, data: { projectId: null } });
  await prisma.project.delete({ where: { id: found.id } });
  res.json({ ok: true });
}));

export default r;
