import { Router } from 'express';
import { countBy, dailySeries, medianResponseHours } from '../domain/analytics';
import { handle, userId } from '../lib/http';
import { prisma } from '../prisma';
import { PIPELINE_STAGES } from './pipeline.routes';

const r = Router();
const DAYS = 30;

r.get('/', handle(async (req, res) => {
  const me = userId(req);
  const now = new Date();
  const from = new Date(now.getTime() - DAYS * 86400000);
  const prevFrom = new Date(now.getTime() - 2 * DAYS * 86400000);
  const [user, startup, investor] = await Promise.all([
    prisma.user.findUnique({ where: { id: me }, select: { role: true } }),
    prisma.startupProfile.findUnique({ where: { userId: me } }),
    prisma.investorProfile.findUnique({ where: { userId: me } }),
  ]);
  const profile = startup ? { type: 'STARTUP', id: startup.id } : investor ? { type: 'INVESTOR', id: investor.id } : null;

  const matches = await prisma.match.findMany({
    where: { OR: [{ startupId: me }, { investorId: me }] },
    select: { id: true, status: true, requestedById: true, createdAt: true, respondedAt: true, startupId: true, investorId: true },
  });
  const received = matches.filter(m => m.requestedById && m.requestedById !== me);
  const sent = matches.filter(m => m.requestedById === me);
  const answered = (l: typeof matches) => l.filter(m => m.status !== 'PENDING');
  const rate = (l: typeof matches) => (answered(l).length ? Math.round((l.filter(m => m.status === 'ACCEPTED').length / answered(l).length) * 100) : null);

  const views = profile
    ? await prisma.profileView.findMany({ where: { profileType: profile.type, profileId: profile.id, createdAt: { gte: prevFrom } }, select: { viewerId: true, createdAt: true } })
    : [];
  const current = views.filter(v => v.createdAt >= from);
  const previous = views.filter(v => v.createdAt < from);

  const common = {
    role: user?.role,
    period: DAYS,
    views: {
      total: current.length,
      previous: previous.length,
      unique: new Set(current.map(v => v.viewerId)).size,
      daily: dailySeries(current.map(v => v.createdAt), DAYS, now),
    },
    requests: {
      received: received.length,
      sent: sent.length,
      pendingReceived: received.filter(m => m.status === 'PENDING').length,
      acceptedConnections: matches.filter(m => m.status === 'ACCEPTED').length,
      acceptanceRateSent: rate(sent),
      medianResponseHours: medianResponseHours(received),
    },
  };

  if (startup) {
    const [inPipelines, viewerTypes] = await Promise.all([
      prisma.pipelineItem.count({ where: { startupId: startup.id, stage: { not: 'PASSED' } } }),
      prisma.investorProfile.findMany({ where: { userId: { in: [...new Set(current.map(v => v.viewerId))] } }, select: { investorType: true } }),
    ]);
    return res.json({ ...common, startup: { inPipelines, viewerTypes: countBy(viewerTypes, v => v.investorType ?? 'UNSPECIFIED') } });
  }

  if (investor) {
    const [pipeline, viewed] = await Promise.all([
      prisma.pipelineItem.findMany({ where: { userId: me }, include: { startup: { select: { id: true, industry: true, stage: true } } } }),
      prisma.profileView.findMany({ where: { viewerId: me, profileType: 'STARTUP', createdAt: { gte: from } }, select: { profileId: true } }),
    ]);
    const connectedStartups = await prisma.startupProfile.findMany({
      where: { userId: { in: matches.filter(m => m.status !== 'REJECTED').map(m => m.startupId) } }, select: { id: true, industry: true, stage: true },
    });
    // Every startup once, whether it is in the pipeline, connected, or both.
    const dealFlow = [...new Map([...pipeline.map(p => p.startup), ...connectedStartups].map(s => [s.id, s])).values()];
    return res.json({
      ...common,
      investor: {
        pipeline: PIPELINE_STAGES.map(s => ({ stage: s, count: pipeline.filter(p => p.stage === s).length })),
        startupsViewed: new Set(viewed.map(v => v.profileId)).size,
        byIndustry: countBy(dealFlow, d => d.industry),
        byStage: countBy(dealFlow, d => d.stage),
      },
    });
  }
  res.json(common);
}));

export default r;
