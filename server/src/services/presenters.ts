import { matchScore, MatchScore } from '../domain/score';

/** Never send password hashes or emails of other users to the client. */
export const publicUser = (u: any) => u && ({ id: u.id, fullName: u.fullName, avatarUrl: u.avatarUrl ?? null, role: u.role });

export const startupCard = (s: any, score?: MatchScore | null) => ({
  id: s.id,
  userId: s.userId,
  companyName: s.companyName,
  tagline: s.tagline ?? null,
  description: s.description ?? null,
  industry: s.industry,
  stage: s.stage,
  fundingNeeded: s.fundingNeeded ?? null,
  amountRaised: s.amountRaised ?? null,
  country: s.country ?? null,
  teamSize: s.teamSize ?? null,
  createdAt: s.createdAt,
  founder: publicUser(s.user),
  match: score ?? null,
});

export const investorCard = (i: any, score?: MatchScore | null) => ({
  id: i.id,
  userId: i.userId,
  name: i.user?.fullName ?? null,
  companyName: i.companyName ?? null,
  investorType: i.investorType ?? null,
  bio: i.bio ?? null,
  industries: i.industries ?? [],
  stagePreference: i.stagePreference ?? [],
  location: i.location ?? null,
  minTicket: i.minTicket ?? null,
  maxTicket: i.maxTicket ?? null,
  investmentRange: i.investmentRange ?? null,
  portfolioCount: i.portfolioCount ?? null,
  createdAt: i.createdAt,
  user: publicUser(i.user),
  match: score ?? null,
});

export const startupDetail = (s: any, score?: MatchScore | null) => ({
  ...startupCard(s, score),
  website: s.website ?? null,
  traction: s.traction ?? null,
  pitchDeckUrl: s.pitchDeckUrl ?? null,
  foundedYear: s.foundedYear ?? null,
  monthlyRevenue: s.monthlyRevenue ?? null,
  monthlyGrowth: s.monthlyGrowth ?? null,
  customers: s.customers ?? null,
  projects: (s.projects ?? []).map((p: any) => ({
    id: p.id, title: p.title, description: p.description, fundingGoal: p.fundingGoal ?? null, industry: p.industry, createdAt: p.createdAt,
  })),
});

export const investorDetail = (i: any, score?: MatchScore | null) => ({ ...investorCard(i, score), website: i.website ?? null });

export const scoreFor = (startup: any, investor: any): MatchScore | null =>
  startup && investor ? matchScore(startup, investor) : null;
