import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { matchScore } from '../domain/score';
import { investorCard, investorDetail, startupCard, startupDetail } from './presenters';

export type StartupFilters = {
  q?: string; industry?: string; stage?: string; country?: string; minFunding?: number; maxFunding?: number;
  sort?: 'match' | 'recent' | 'funding'; page?: number; pageSize?: number;
};
export type InvestorFilters = { q?: string; industry?: string; stage?: string; location?: string; type?: string; sort?: 'match' | 'recent'; page?: number; pageSize?: number };

const page = <T>(items: T[], p = 1, size = 24) => {
  const total = items.length;
  const pageN = Math.max(1, p);
  return { items: items.slice((pageN - 1) * size, pageN * size), total, page: pageN, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) };
};

/** The viewer's own profile, used to score the other side. */
export async function viewerProfiles(userId: string) {
  const [startup, investor] = await Promise.all([
    prisma.startupProfile.findUnique({ where: { userId } }),
    prisma.investorProfile.findUnique({ where: { userId } }),
  ]);
  return { startup, investor };
}

export async function listStartups(viewerId: string, f: StartupFilters) {
  const { investor } = await viewerProfiles(viewerId);
  const where: Prisma.StartupProfileWhereInput = {
    userId: { not: viewerId },
    ...(f.industry ? { industry: f.industry as any } : {}),
    ...(f.stage ? { stage: f.stage as any } : {}),
    ...(f.country ? { country: { contains: f.country, mode: 'insensitive' } } : {}),
    ...(f.minFunding != null || f.maxFunding != null ? { fundingNeeded: { gte: f.minFunding ?? undefined, lte: f.maxFunding ?? undefined } } : {}),
    ...(f.q ? { OR: [
      { companyName: { contains: f.q, mode: 'insensitive' } },
      { tagline: { contains: f.q, mode: 'insensitive' } },
      { description: { contains: f.q, mode: 'insensitive' } },
    ] } : {}),
  };
  const rows = await prisma.startupProfile.findMany({ where, include: { user: true }, orderBy: { createdAt: 'desc' }, take: 1000 });
  let cards = rows.map(s => startupCard(s, investor ? matchScore(s, investor) : null));
  const sort = f.sort ?? (investor ? 'match' : 'recent');
  if (sort === 'match' && investor) cards.sort((a, b) => b.match!.score - a.match!.score);
  if (sort === 'funding') cards = cards.sort((a, b) => (b.fundingNeeded ?? 0) - (a.fundingNeeded ?? 0));
  return page(cards, f.page, f.pageSize);
}

export async function listInvestors(viewerId: string, f: InvestorFilters) {
  const { startup } = await viewerProfiles(viewerId);
  const where: Prisma.InvestorProfileWhereInput = {
    userId: { not: viewerId },
    ...(f.industry ? { industries: { has: f.industry as any } } : {}),
    ...(f.stage ? { stagePreference: { has: f.stage as any } } : {}),
    ...(f.location ? { location: { contains: f.location, mode: 'insensitive' } } : {}),
    ...(f.type ? { investorType: f.type } : {}),
    ...(f.q ? { OR: [
      { companyName: { contains: f.q, mode: 'insensitive' } },
      { bio: { contains: f.q, mode: 'insensitive' } },
      { user: { fullName: { contains: f.q, mode: 'insensitive' } } },
    ] } : {}),
  };
  const rows = await prisma.investorProfile.findMany({ where, include: { user: true }, orderBy: { createdAt: 'desc' }, take: 1000 });
  const cards = rows.map(i => investorCard(i, startup ? matchScore(startup, i) : null));
  if ((f.sort ?? (startup ? 'match' : 'recent')) === 'match' && startup) cards.sort((a, b) => b.match!.score - a.match!.score);
  return page(cards, f.page, f.pageSize);
}

/** Visits are counted once per viewer, profile and day; owners viewing themselves are ignored. */
async function recordView(viewerId: string, profileType: 'STARTUP' | 'INVESTOR', profileId: string, ownerId: string) {
  if (viewerId === ownerId) return;
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const seen = await prisma.profileView.findFirst({ where: { viewerId, profileType, profileId, createdAt: { gte: since } }, select: { id: true } });
  if (!seen) await prisma.profileView.create({ data: { viewerId, profileType, profileId } });
}

export async function connectionBetween(a: string, b: string) {
  const m = await prisma.match.findFirst({
    where: { OR: [{ startupId: a, investorId: b }, { startupId: b, investorId: a }] },
    orderBy: { createdAt: 'desc' },
  });
  return m && { id: m.id, status: m.status, requestedById: m.requestedById, createdAt: m.createdAt };
}

export async function getStartup(viewerId: string, id: string) {
  const s = await prisma.startupProfile.findUnique({ where: { id }, include: { user: true, projects: { orderBy: { createdAt: 'desc' } } } });
  if (!s) return null;
  const { investor } = await viewerProfiles(viewerId);
  const [connection, pipeline] = await Promise.all([
    connectionBetween(viewerId, s.userId),
    investor ? prisma.pipelineItem.findUnique({ where: { userId_startupId: { userId: viewerId, startupId: s.id } } }) : null,
  ]);
  await recordView(viewerId, 'STARTUP', s.id, s.userId);
  return {
    ...startupDetail(s, investor ? matchScore(s, investor) : null),
    connection,
    pipeline: pipeline && { stage: pipeline.stage, notes: pipeline.notes, updatedAt: pipeline.updatedAt },
  };
}

export async function getInvestor(viewerId: string, id: string) {
  const i = await prisma.investorProfile.findUnique({ where: { id }, include: { user: true } });
  if (!i) return null;
  const { startup } = await viewerProfiles(viewerId);
  const connection = await connectionBetween(viewerId, i.userId);
  await recordView(viewerId, 'INVESTOR', i.id, i.userId);
  return { ...investorDetail(i, startup ? matchScore(startup, i) : null), connection };
}

/** Below this score a profile is not worth suggesting. */
const MIN_RECOMMENDED = 40;

/** Best-scored counterparts the viewer is not connected with yet. */
export async function recommendations(viewerId: string, limit = 6) {
  const { startup, investor } = await viewerProfiles(viewerId);
  const connected = await prisma.match.findMany({
    where: { OR: [{ startupId: viewerId }, { investorId: viewerId }], status: { in: ['PENDING', 'ACCEPTED'] } },
    select: { startupId: true, investorId: true },
  });
  const exclude = new Set(connected.flatMap(m => [m.startupId, m.investorId]));
  if (investor) {
    // Startups already on the board (any stage) are tracked, not recommended again.
    const tracked = await prisma.pipelineItem.findMany({ where: { userId: viewerId }, select: { startupId: true } });
    const passedIds = new Set(tracked.map(p => p.startupId));
    const rows = await prisma.startupProfile.findMany({ where: { userId: { not: viewerId } }, include: { user: true }, take: 1000 });
    return {
      kind: 'startups' as const,
      items: rows.filter(s => !exclude.has(s.userId) && !passedIds.has(s.id))
        .map(s => startupCard(s, matchScore(s, investor)))
        .filter(c => c.match!.score >= MIN_RECOMMENDED)
        .sort((a, b) => b.match!.score - a.match!.score).slice(0, limit),
    };
  }
  if (startup) {
    const rows = await prisma.investorProfile.findMany({ where: { userId: { not: viewerId } }, include: { user: true }, take: 1000 });
    return {
      kind: 'investors' as const,
      items: rows.filter(i => !exclude.has(i.userId))
        .map(i => investorCard(i, matchScore(startup, i)))
        .filter(c => c.match!.score >= MIN_RECOMMENDED)
        .sort((a, b) => b.match!.score - a.match!.score).slice(0, limit),
    };
  }
  return { kind: 'none' as const, items: [] };
}
