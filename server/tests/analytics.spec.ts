import { countBy, dailySeries, medianResponseHours } from '../src/domain/analytics';

describe('analytics helpers', () => {
  const now = new Date('2026-10-08T12:00:00Z');

  it('builds a daily series with empty days', () => {
    const s = dailySeries([new Date('2026-10-08T01:00:00Z'), new Date('2026-10-08T22:00:00Z'), new Date('2026-10-01T10:00:00Z'), new Date('2026-01-01')], 7, now);
    expect(s).toHaveLength(7);
    expect(s[0].date).toBe('2026-10-02');
    expect(s.at(-1)).toEqual({ date: '2026-10-08', count: 2 });
    expect(s.reduce((n, d) => n + d.count, 0)).toBe(2);
  });

  it('counts and sorts by key', () => {
    expect(countBy(['AI', 'FINTECH', 'AI', null], x => x)).toEqual([{ name: 'AI', count: 2 }, { name: 'FINTECH', count: 1 }]);
  });

  it('computes the median response time in hours', () => {
    const t = (h: number) => new Date(now.getTime() + h * 3600000);
    expect(medianResponseHours([
      { createdAt: now, respondedAt: t(2) }, { createdAt: now, respondedAt: t(10) }, { createdAt: now, respondedAt: t(4) }, { createdAt: now, respondedAt: null },
    ])).toBe(4);
    expect(medianResponseHours([])).toBeNull();
  });
});
