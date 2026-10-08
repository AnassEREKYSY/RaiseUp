import { matchScore, ScoreInvestor } from '../src/domain/score';
import { parseAmount, parseRange } from '../src/domain/money';

const investor = (o: Partial<ScoreInvestor> = {}): ScoreInvestor => ({
  industries: ['FINTECH'], stagePreference: ['MVP'], location: 'France', minTicket: 100000, maxTicket: 500000, investmentRange: null, ...o,
});
const startup = { industry: 'FINTECH', stage: 'MVP', fundingNeeded: 300000, country: 'France' };

describe('matchScore', () => {
  it('is 100 when every criterion matches', () => {
    expect(matchScore(startup, investor()).score).toBe(100);
  });

  it('gives no industry points outside the focus and explains why', () => {
    const r = matchScore({ ...startup, industry: 'AI' }, investor());
    expect(r.score).toBe(65);
    expect(r.reasons.find(x => x.label.startsWith('Industry'))).toMatchObject({ ok: false, points: 0 });
  });

  it('gives partial credit to a neighbouring stage', () => {
    expect(matchScore({ ...startup, stage: 'GROWTH' }, investor()).reasons[1].points).toBe(12);
    expect(matchScore({ ...startup, stage: 'EXIT' }, investor()).reasons[1].points).toBe(0);
  });

  it('treats empty criteria as open, with partial points', () => {
    const r = matchScore(startup, investor({ industries: [], stagePreference: [], location: null, minTicket: null, maxTicket: null }));
    expect(r.score).toBe(21 + 18 + 13 + 7);
  });

  it('reads the legacy free-text range when tickets are missing', () => {
    const i = investor({ minTicket: null, maxTicket: null, investmentRange: '50k-200k' });
    expect(matchScore({ ...startup, fundingNeeded: 150000 }, i).reasons[2].points).toBe(25);
    expect(matchScore({ ...startup, fundingNeeded: 250000 }, i).reasons[2].points).toBe(13);
    expect(matchScore({ ...startup, fundingNeeded: 900000 }, i).reasons[2].points).toBe(0);
  });

  it('matches countries loosely and accepts global investors', () => {
    expect(matchScore({ ...startup, country: 'france' }, investor({ location: 'Paris, France' })).reasons[3].points).toBe(10);
    expect(matchScore({ ...startup, country: 'Spain' }, investor({ location: 'Global' })).reasons[3].points).toBe(7);
  });
});

describe('money parsing', () => {
  it.each([
    ['50k', 50000], ['1.5M', 1500000], ['$200,000', 200000], ['€2m', 2000000], ['abc', null],
  ])('parseAmount(%s)', (raw, expected) => expect(parseAmount(raw)).toBe(expected));

  it('parses ranges in several formats', () => {
    expect(parseRange('$100,000 - $500,000')).toEqual({ min: 100000, max: 500000 });
    expect(parseRange('up to 1M')).toEqual({ min: null, max: 1000000 });
    expect(parseRange('200k to 50k')).toEqual({ min: 50000, max: 200000 });
    expect(parseRange(null)).toEqual({ min: null, max: null });
  });
});
