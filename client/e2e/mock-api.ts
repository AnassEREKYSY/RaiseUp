import { Page, Route } from '@playwright/test';

const API = 'http://localhost:4000/api';
const investorMe = {
  id: 'inv', email: 'anna@fund.test', fullName: 'Anna Lind', avatarUrl: null, role: 'INVESTOR', createdAt: '2026-01-01', hasProfile: true, startup: null,
  investor: { id: 'ip1', userId: 'inv', name: 'Anna Lind', companyName: 'Seedlane', investorType: 'VC', bio: 'B2B seed', industries: ['AI'], stagePreference: ['MVP'], location: 'France', minTicket: 100000, maxTicket: 800000, investmentRange: null, portfolioCount: 3, website: 'https://x.test', createdAt: '', user: null, match: null },
};
const score = (n: number) => ({ score: n, reasons: [{ label: 'Industry is a focus', points: 35, max: 35, ok: true }, { label: 'Stage matches', points: 30, max: 30, ok: true }] });
const startup = (id: string, name: string, n: number) => ({
  id, userId: 'u-' + id, companyName: name, tagline: `${name} tagline`, description: null, industry: 'AI', stage: 'MVP', fundingNeeded: 500000,
  amountRaised: 100000, country: 'France', teamSize: 5, createdAt: '2026-09-01', founder: { id: 'u-' + id, fullName: `${name} Founder`, avatarUrl: null, role: 'STARTUP' }, match: score(n),
});

export interface MockState { calls: { method: string; path: string; body?: any }[]; messages: any[]; signedIn: boolean; requestAccepted: boolean }

export async function mockApi(page: Page, opts: { signedIn?: boolean } = {}) {
  const state: MockState = { calls: [], messages: [{ id: 'm1', matchId: 'c1', senderId: 'u-s1', content: 'Hello Anna', kind: 'TEXT', meta: null, createdAt: '2026-10-08T09:00:00Z' }], signedIn: !!opts.signedIn, requestAccepted: false };
  if (opts.signedIn) await page.addInitScript(() => localStorage.setItem('raiseup_token', 'tok'));
  await page.route('http://localhost:4000/api/socket.io/**', r => r.abort());
  await page.route(`${API}/**`, async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname.replace('/api', '');
    const method = req.method();
    const body = req.postData() ? JSON.parse(req.postData()!) : undefined;
    state.calls.push({ method, path, body });
    const json = (d: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(d) });

    if (path === '/auth/me') return state.signedIn ? json({ user: investorMe }) : json({ error: 'Sign in required' }, 401);
    if (path === '/auth/login') {
      if (body.password !== 'right-password') return json({ error: 'Email or password is incorrect.' }, 401);
      state.signedIn = true;
      return json({ token: 'tok', user: investorMe });
    }
    if (path === '/recommendations') return json({ kind: 'startups', items: [startup('s1', 'VisionQA', 92)] });
    if (path === '/analytics') return json({ role: 'INVESTOR', period: 30, views: { total: 4, previous: 1, unique: 3, daily: Array.from({ length: 30 }, (_, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, count: i % 3 })) }, requests: { received: 1, sent: 1, pendingReceived: 1, acceptedConnections: 1, acceptanceRateSent: 100, medianResponseHours: 2 }, investor: { pipeline: [{ stage: 'INTERESTED', count: 1 }], startupsViewed: 2, byIndustry: [], byStage: [] } });
    if (path === '/connections' && method === 'GET') return json({ items: [
      { id: 'c1', status: 'ACCEPTED', direction: 'outgoing', createdAt: '2026-10-01', lastMessageAt: '2026-10-08T09:00:00Z', counterpart: { id: 'u-s1', fullName: 'VisionQA Founder', avatarUrl: null, role: 'STARTUP', profile: { type: 'STARTUP', profileId: 's1', title: 'VisionQA' } }, lastMessage: { content: 'Hello Anna', senderId: 'u-s1', createdAt: '2026-10-08T09:00:00Z' }, unread: 1 },
      { id: 'c2', status: state.requestAccepted ? 'ACCEPTED' : 'PENDING', direction: 'incoming', createdAt: '2026-10-07', lastMessageAt: '2026-10-07T09:00:00Z', counterpart: { id: 'u-s2', fullName: 'Lena Varga', avatarUrl: null, role: 'STARTUP', profile: { type: 'STARTUP', profileId: 's2', title: 'Northwind' } }, lastMessage: { content: 'Can we talk?', senderId: 'u-s2', createdAt: '2026-10-07T09:00:00Z' }, unread: 0 },
    ] });
    if (path === '/connections/unread') return json({ count: 1 });
    if (path === '/connections/c2/accept') { state.requestAccepted = true; return json({ id: 'c2', status: 'ACCEPTED' }); }
    if (path === '/connections/c1') return json({ id: 'c1', status: 'ACCEPTED', direction: 'outgoing', createdAt: '2026-10-01', counterpart: { id: 'u-s1', fullName: 'VisionQA Founder', avatarUrl: null, role: 'STARTUP', profile: { type: 'STARTUP', profileId: 's1', title: 'VisionQA' } }, messages: state.messages });
    if (path === '/connections/c1/messages' && method === 'POST') {
      const m = { id: 'm' + (state.messages.length + 1), matchId: 'c1', senderId: 'inv', content: body.content, kind: 'TEXT', meta: null, createdAt: new Date().toISOString() };
      state.messages.push(m);
      return json(m, 201);
    }
    if (path.endsWith('/read')) return json({ ok: true });
    if (path === '/notifications') return json({ items: [], unread: 0 });
    if (path === '/startups') {
      const items = url.searchParams.get('industry') === 'FINTECH' ? [startup('s3', 'Ledgerly', 40)] : [startup('s1', 'VisionQA', 92), startup('s2', 'Northwind', 61)];
      return json({ items, total: items.length, page: 1, pageSize: 24, totalPages: 1 });
    }
    if (path === '/pipeline' && method === 'GET') return json({ stages: ['INTERESTED', 'CONTACTED', 'MEETING', 'DUE_DILIGENCE', 'INVESTED', 'PASSED'], items: [{ id: 'p1', stage: 'INTERESTED', notes: null, position: 0, createdAt: '', updatedAt: '', startup: startup('s1', 'VisionQA', 92) }] });
    if (path.startsWith('/pipeline/') && method === 'PUT') return json({ id: 'p1', stage: body.stage ?? 'INTERESTED' });
    return json({ error: `not mocked ${method} ${path}` }, 404);
  });
  return state;
}
