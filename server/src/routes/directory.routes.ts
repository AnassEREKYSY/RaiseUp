import { Router } from 'express';
import { z } from 'zod';
import { handle, notFound, parse, userId } from '../lib/http';
import { getInvestor, getStartup, listInvestors, listStartups, recommendations } from '../services/directory.service';

const r = Router();
const num = z.coerce.number().nonnegative().optional();
const str = z.string().trim().max(100).optional().transform(v => v || undefined);
const startupQuery = z.object({
  q: str, industry: str, stage: str, country: str, minFunding: num, maxFunding: num,
  sort: z.enum(['match', 'recent', 'funding']).optional(), page: z.coerce.number().int().min(1).optional(),
});
const investorQuery = z.object({
  q: str, industry: str, stage: str, location: str, type: str,
  sort: z.enum(['match', 'recent']).optional(), page: z.coerce.number().int().min(1).optional(),
});

r.get('/startups', handle(async (req, res) => res.json(await listStartups(userId(req), parse(startupQuery, req.query)))));
r.get('/startups/:id', handle(async (req, res) => {
  const s = await getStartup(userId(req), String(req.params.id));
  if (!s) throw notFound('Startup not found');
  res.json(s);
}));
r.get('/investors', handle(async (req, res) => res.json(await listInvestors(userId(req), parse(investorQuery, req.query)))));
r.get('/investors/:id', handle(async (req, res) => {
  const i = await getInvestor(userId(req), String(req.params.id));
  if (!i) throw notFound('Investor not found');
  res.json(i);
}));
r.get('/recommendations', handle(async (req, res) => {
  const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 6));
  res.json(await recommendations(userId(req), limit));
}));

export default r;
