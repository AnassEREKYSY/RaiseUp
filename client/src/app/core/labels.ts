import { Industry, InvestorType, PipelineStage, Stage } from './models';

export const INDUSTRIES: Industry[] = ['FINTECH', 'HEALTHCARE', 'EDUCATION', 'ECOMMERCE', 'AI', 'BLOCKCHAIN', 'GREEN_TECH', 'LOGISTICS', 'AGRITECH', 'OTHER'];
export const STAGES: Stage[] = ['IDEA', 'MVP', 'GROWTH', 'SCALE', 'EXIT'];
export const INVESTOR_TYPES: InvestorType[] = ['ANGEL', 'VC', 'CORPORATE', 'FAMILY_OFFICE', 'ACCELERATOR'];
export const PIPELINE_STAGES: PipelineStage[] = ['INTERESTED', 'CONTACTED', 'MEETING', 'DUE_DILIGENCE', 'INVESTED', 'PASSED'];

const L: Record<string, string> = {
  FINTECH: 'Fintech', HEALTHCARE: 'Healthcare', EDUCATION: 'Education', ECOMMERCE: 'E-commerce', AI: 'AI', BLOCKCHAIN: 'Blockchain',
  GREEN_TECH: 'Climate', LOGISTICS: 'Logistics', AGRITECH: 'Agritech', OTHER: 'Other',
  IDEA: 'Idea', MVP: 'MVP', GROWTH: 'Growth', SCALE: 'Scale', EXIT: 'Exit',
  ANGEL: 'Angel', VC: 'VC fund', CORPORATE: 'Corporate', FAMILY_OFFICE: 'Family office', ACCELERATOR: 'Accelerator', UNSPECIFIED: 'Not specified',
  INTERESTED: 'Interested', CONTACTED: 'Contacted', MEETING: 'Meeting', DUE_DILIGENCE: 'Due diligence', INVESTED: 'Invested', PASSED: 'Passed',
  STARTUP: 'Startup', INVESTOR: 'Investor',
};
export const label = (k: string | null | undefined) => (k ? L[k] ?? k : '');

/** 1250000 -> "€1.25M" */
export function money(n: number | null | undefined, empty = '–') {
  if (n === null || n === undefined) return empty;
  const abs = Math.abs(n);
  const v = abs >= 1e6 ? `${+(n / 1e6).toFixed(2)}M` : abs >= 1e3 ? `${+(n / 1e3).toFixed(n % 1000 ? 1 : 0)}k` : `${n}`;
  return `€${v}`;
}

export function ticket(min: number | null, max: number | null) {
  if (min == null && max == null) return 'Not specified';
  if (min != null && max != null) return `${money(min)} – ${money(max)}`;
  return min != null ? `From ${money(min)}` : `Up to ${money(max)}`;
}

export function initials(name: string | null | undefined) {
  return (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('');
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
