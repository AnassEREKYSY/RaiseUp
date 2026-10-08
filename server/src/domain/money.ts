/** Parses amounts like "50k", "1.5M", "$200,000", "€2m" into numbers. */
export function parseAmount(raw: string): number | null {
  const m = raw.trim().toLowerCase().replace(/[$€£\s]/g, '').replace(/,(?=\d{3}\b)/g, '').match(/^(\d+(?:[.,]\d+)?)([km]?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  return m[2] === 'k' ? n * 1_000 : m[2] === 'm' ? n * 1_000_000 : n;
}

/** Old free-text ranges ("50k-200k", "$100,000 - $500,000", "up to 1M") to [min, max]. */
export function parseRange(raw: string | null | undefined): { min: number | null; max: number | null } {
  if (!raw) return { min: null, max: null };
  const s = raw.toLowerCase();
  const parts = s.split(/\s*(?:-|–|to|à)\s*/).map(parseAmount).filter((n): n is number => n !== null);
  if (/up to|max|under|</.test(s) && parts.length === 1) return { min: null, max: parts[0] };
  if (/from|min|over|\+|>/.test(s) && parts.length === 1) return { min: parts[0], max: null };
  if (parts.length >= 2) return { min: Math.min(parts[0], parts[1]), max: Math.max(parts[0], parts[1]) };
  if (parts.length === 1) return { min: parts[0], max: parts[0] };
  return { min: null, max: null };
}
