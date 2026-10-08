import { Router } from 'express';
import { z } from 'zod';
import { matchScore } from '../domain/score';
import { handle, notFound, parse, userId } from '../lib/http';
import { requireRole } from '../middlewares/auth';
import { prisma } from '../prisma';
import { startupCard } from '../services/presenters';

export const PIPELINE_STAGES = ['INTERESTED', 'CONTACTED', 'MEETING', 'DUE_DILIGENCE', 'INVESTED', 'PASSED'] as const;
const r = Router();
r.use(requireRole('INVESTOR'));

r.get('/', handle(async (req, res) => {
  const me = userId(req);
  const [items, investor] = await Promise.all([
    prisma.pipelineItem.findMany({ where: { userId: me }, include: { startup: { include: { user: true } } }, orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }] }),
    prisma.investorProfile.findUnique({ where: { userId: me } }),
  ]);
  res.json({
    stages: PIPELINE_STAGES,
    items: items.map(i => ({
      id: i.id, stage: i.stage, notes: i.notes, position: i.position, createdAt: i.createdAt, updatedAt: i.updatedAt,
      startup: startupCard(i.startup, investor ? matchScore(i.startup, investor) : null),
    })),
  });
}));

r.put('/:startupId', handle(async (req, res) => {
  const me = userId(req);
  const startupId = String(req.params.startupId);
  const body = parse(z.object({
    stage: z.enum(PIPELINE_STAGES).optional(),
    notes: z.string().trim().max(4000).nullish(),
    position: z.number().int().min(0).max(100000).optional(),
  }), req.body);
  if (!(await prisma.startupProfile.findUnique({ where: { id: startupId }, select: { id: true } }))) throw notFound('Startup not found');
  const data = { ...(body.stage ? { stage: body.stage } : {}), ...(body.notes !== undefined ? { notes: body.notes || null } : {}), ...(body.position !== undefined ? { position: body.position } : {}) };
  const item = await prisma.pipelineItem.upsert({
    where: { userId_startupId: { userId: me, startupId } },
    create: { userId: me, startupId, stage: body.stage ?? 'INTERESTED', notes: body.notes || null, position: body.position ?? 0 },
    update: data,
  });
  res.json(item);
}));

r.delete('/:startupId', handle(async (req, res) => {
  await prisma.pipelineItem.deleteMany({ where: { userId: userId(req), startupId: String(req.params.startupId) } });
  res.json({ ok: true });
}));

export default r;
