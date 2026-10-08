import { parseRange } from './money';

export type ScoreStartup = { industry: string; stage: string; fundingNeeded: number | null; country: string | null };
export type ScoreInvestor = {
  industries: string[]; stagePreference: string[]; location: string | null;
  minTicket: number | null; maxTicket: number | null; investmentRange: string | null;
};
export type ScoreReason = { label: string; points: number; max: number; ok: boolean };
export type MatchScore = { score: number; reasons: ScoreReason[] };

const WEIGHTS = { industry: 35, stage: 30, ticket: 25, location: 10 } as const;
const STAGES = ['IDEA', 'MVP', 'GROWTH', 'SCALE', 'EXIT'];
const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
const fmt = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n));

/**
 * How well a startup fits an investor's criteria, 0-100.
 * An investor who left a criterion empty is treated as open to anything (partial points).
 */
export function matchScore(s: ScoreStartup, i: ScoreInvestor): MatchScore {
  const reasons: ScoreReason[] = [];

  // Industry
  if (!i.industries?.length) reasons.push({ label: 'Open to all industries', points: Math.round(WEIGHTS.industry * 0.6), max: WEIGHTS.industry, ok: true });
  else if (i.industries.includes(s.industry)) reasons.push({ label: 'Industry is a focus', points: WEIGHTS.industry, max: WEIGHTS.industry, ok: true });
  else reasons.push({ label: 'Industry outside focus', points: 0, max: WEIGHTS.industry, ok: false });

  // Stage: exact match, or one stage away for partial credit
  if (!i.stagePreference?.length) reasons.push({ label: 'Open to all stages', points: Math.round(WEIGHTS.stage * 0.6), max: WEIGHTS.stage, ok: true });
  else if (i.stagePreference.includes(s.stage)) reasons.push({ label: 'Stage matches', points: WEIGHTS.stage, max: WEIGHTS.stage, ok: true });
  else {
    const idx = STAGES.indexOf(s.stage);
    const near = i.stagePreference.some(p => Math.abs(STAGES.indexOf(p) - idx) === 1);
    reasons.push(near
      ? { label: 'Stage is one step away', points: Math.round(WEIGHTS.stage * 0.4), max: WEIGHTS.stage, ok: false }
      : { label: 'Stage outside preference', points: 0, max: WEIGHTS.stage, ok: false });
  }

  // Ticket
  const parsed = parseRange(i.investmentRange);
  const min = i.minTicket ?? parsed.min;
  const max = i.maxTicket ?? parsed.max;
  const need = s.fundingNeeded;
  if (!need || (min === null && max === null)) {
    reasons.push({ label: 'Ticket size not specified', points: Math.round(WEIGHTS.ticket * 0.5), max: WEIGHTS.ticket, ok: true });
  } else {
    const lo = min ?? 0, hi = max ?? Infinity;
    if (need >= lo && need <= hi) reasons.push({ label: `Raise of ${fmt(need)} fits the ticket`, points: WEIGHTS.ticket, max: WEIGHTS.ticket, ok: true });
    else {
      const off = need < lo ? (lo - need) / lo : (need - hi) / hi;
      reasons.push(off <= 0.5
        ? { label: `Raise of ${fmt(need)} is close to the ticket`, points: Math.round(WEIGHTS.ticket * 0.5), max: WEIGHTS.ticket, ok: false }
        : { label: `Raise of ${fmt(need)} is outside the ticket`, points: 0, max: WEIGHTS.ticket, ok: false });
    }
  }

  // Location
  const loc = norm(i.location), country = norm(s.country);
  if (!loc || /global|worldwide|anywhere|remote/.test(loc)) reasons.push({ label: 'Invests in any country', points: Math.round(WEIGHTS.location * 0.7), max: WEIGHTS.location, ok: true });
  else if (country && (loc.includes(country) || country.includes(loc))) reasons.push({ label: 'Same country', points: WEIGHTS.location, max: WEIGHTS.location, ok: true });
  else reasons.push({ label: 'Different country', points: 0, max: WEIGHTS.location, ok: false });

  return { score: reasons.reduce((n, r) => n + r.points, 0), reasons };
}
