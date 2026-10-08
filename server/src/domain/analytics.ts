/** Daily counts for the last `days` days (oldest first), including empty days. */
export function dailySeries(dates: Date[], days: number, now = new Date()) {
  const out: { date: string; count: number }[] = [];
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));
  const idx = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
    idx.set(d, out.length);
    out.push({ date: d, count: 0 });
  }
  for (const d of dates) {
    const k = d.toISOString().slice(0, 10);
    const i = idx.get(k);
    if (i !== undefined) out[i].count++;
  }
  return out;
}

export function countBy<T>(items: T[], key: (t: T) => string | null | undefined) {
  const m = new Map<string, number>();
  for (const it of items) { const k = key(it); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
}

/** Median hours between a request and its answer. */
export function medianResponseHours(pairs: { createdAt: Date; respondedAt: Date | null }[]) {
  const h = pairs.filter(p => p.respondedAt).map(p => (p.respondedAt!.getTime() - p.createdAt.getTime()) / 3600000).sort((a, b) => a - b);
  if (!h.length) return null;
  const mid = Math.floor(h.length / 2);
  return Math.round((h.length % 2 ? h[mid] : (h[mid - 1] + h[mid]) / 2) * 10) / 10;
}
