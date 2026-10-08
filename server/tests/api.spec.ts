import request from 'supertest';
import bcrypt from 'bcryptjs';

const db: any = {
  user: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  match: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  message: { create: jest.fn(), findMany: jest.fn() },
  matchRead: { upsert: jest.fn() },
  notification: { create: jest.fn() },
  startupProfile: { findUnique: jest.fn(), findMany: jest.fn() },
  investorProfile: { findUnique: jest.fn(), findMany: jest.fn() },
  pipelineItem: { findUnique: jest.fn() },
  profileView: { findFirst: jest.fn(), create: jest.fn() },
};
jest.mock('../src/prisma', () => ({ prisma: db }));

import { createApp } from '../src/app';
import { signToken } from '../src/middlewares/auth';

const app = createApp();
const auth = (id: string, role: 'STARTUP' | 'INVESTOR') => ({ Authorization: `Bearer ${signToken({ id, role })}` });

describe('API', () => {
  it('requires a token on private routes', async () => {
    await request(app).get('/api/startups').expect(401);
    await request(app).get('/api/connections').set('Authorization', 'Bearer nope').expect(401);
  });

  it('validates registration input', async () => {
    const r = await request(app).post('/api/auth/register').send({ email: 'a@b.co', password: 'short', fullName: 'Al', role: 'STARTUP' }).expect(400);
    expect(r.body.error).toMatch(/password/);
  });

  it('uses one message for unknown email and wrong password', async () => {
    db.user.findFirst.mockResolvedValueOnce(null);
    const a = await request(app).post('/api/auth/login').send({ email: 'x@y.co', password: 'whatever' }).expect(401);
    db.user.findFirst.mockResolvedValueOnce({ id: 'u', password: await bcrypt.hash('right-password', 4) });
    const b = await request(app).post('/api/auth/login').send({ email: 'x@y.co', password: 'wrong-password' }).expect(401);
    expect(a.body.error).toBe(b.body.error);
  });

  it('never returns password hashes in the directory', async () => {
    db.investorProfile.findUnique.mockResolvedValue(null);
    db.startupProfile.findUnique.mockResolvedValue(null);
    db.startupProfile.findMany.mockResolvedValue([{
      id: 's1', userId: 'u2', companyName: 'Acme', industry: 'AI', stage: 'MVP', createdAt: new Date(),
      user: { id: 'u2', fullName: 'Founder', email: 'f@acme.co', password: 'HASH', role: 'STARTUP' },
    }]);
    const r = await request(app).get('/api/startups').set(auth('u1', 'INVESTOR')).expect(200);
    expect(JSON.stringify(r.body)).not.toMatch(/HASH|f@acme\.co/);
    expect(r.body.items[0].founder).toEqual({ id: 'u2', fullName: 'Founder', avatarUrl: null, role: 'STARTUP' });
  });

  it('keeps conversations private to their two participants', async () => {
    db.match.findUnique.mockResolvedValue({ id: 'm1', startupId: 'a', investorId: 'b', status: 'ACCEPTED' });
    await request(app).get('/api/connections/m1').set(auth('intruder', 'INVESTOR')).expect(403);
    await request(app).post('/api/connections/m1/messages').set(auth('intruder', 'INVESTOR')).send({ content: 'hi' }).expect(403);
  });

  it('blocks messages before the request is accepted', async () => {
    db.match.findUnique.mockResolvedValue({ id: 'm1', startupId: 'a', investorId: 'b', status: 'PENDING', requestedById: 'b' });
    await request(app).post('/api/connections/m1/messages').set(auth('b', 'INVESTOR')).send({ content: 'hi' }).expect(409);
  });

  it('lets only the receiver answer a request', async () => {
    db.match.findUnique.mockResolvedValue({ id: 'm1', startupId: 'a', investorId: 'b', status: 'PENDING', requestedById: 'b' });
    await request(app).patch('/api/connections/m1/accept').set(auth('b', 'INVESTOR')).expect(403);
  });

  it('only connects a startup with an investor', async () => {
    db.user.findUnique.mockImplementation(({ where }: any) => Promise.resolve({ id: where.id, role: 'STARTUP', fullName: 'X' }));
    await request(app).post('/api/connections').set(auth('a', 'STARTUP')).send({ userId: 'c' }).expect(400);
  });

  it('keeps the pipeline for investors', async () => {
    await request(app).get('/api/pipeline').set(auth('a', 'STARTUP')).expect(403);
  });

  it('rejects meeting slots in the past', async () => {
    await request(app).post('/api/connections/m1/meetings').set(auth('a', 'STARTUP'))
      .send({ slots: ['2020-01-01T10:00:00Z'] }).expect(400);
  });
});
