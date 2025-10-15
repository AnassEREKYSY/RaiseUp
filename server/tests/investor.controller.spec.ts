import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import { prisma } from '../src/prisma';
import { InvestorController } from '../src/controllers/investor.controller';
import { Industry, Stage } from '../src/models/enums';

jest.mock('../src/prisma', () => ({
  prisma: {
    investorProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

function mountApp(withUser = true) {
  const controller = new InvestorController();
  const app = express();
  app.use(express.json());

  if (withUser) {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      (req as any).user = { id: 'u1' };
      next();
    });
  }

  app.get('/investors', controller.getAll.bind(controller));
  app.get('/investors/:id', controller.getById.bind(controller));
  app.post('/investors', controller.create.bind(controller));
  app.put('/investors/:id', controller.update.bind(controller));
  app.delete('/investors/:id', controller.delete.bind(controller));
  app.get('/investors-search', controller.search.bind(controller));

  return app;
}

describe('InvestorController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET /investors returns list', async () => {
    (prisma.investorProfile.findMany as jest.Mock).mockResolvedValue([{ id: 'i1' }]);
    const app = mountApp();
    const res = await request(app).get('/investors');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'i1' }]);
    expect(prisma.investorProfile.findMany).toHaveBeenCalledWith({
      include: { user: true, matches: true },
    });
  });

  it('GET /investors/:id returns one', async () => {
    (prisma.investorProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'i1' });
    const app = mountApp();
    const res = await request(app).get('/investors/i1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'i1' });
    expect(prisma.investorProfile.findUnique).toHaveBeenCalledWith({
      where: { id: 'i1' },
      include: { user: true, matches: true },
    });
  });

  it('POST /investors creates profile with user from token', async () => {
    (prisma.investorProfile.create as jest.Mock).mockResolvedValue({
      id: 'i1',
      userId: 'u1',
      location: 'Paris',
    });
    const app = mountApp(true);
    const res = await request(app).post('/investors').send({
      industries: [Industry.FINTECH],
      stagePreference: [Stage.MVP],
      location: 'Paris',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'i1', hasProfile: true });
    expect(prisma.investorProfile.create).toHaveBeenCalledWith({
      data: { industries: [Industry.FINTECH], stagePreference: [Stage.MVP], location: 'Paris', userId: 'u1' },
    });
  });

  it('POST /investors returns 400 if user missing in token', async () => {
    const app = mountApp(false);
    const res = await request(app).post('/investors').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid or missing user in token.' });
  });

  it('PUT /investors/:id updates profile', async () => {
    (prisma.investorProfile.update as jest.Mock).mockResolvedValue({ id: 'i1', user: { id: 'u1' }, location: 'Lyon' });
    const app = mountApp();
    const res = await request(app).put('/investors/i1').send({ location: 'Lyon' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'i1', user: { id: 'u1' }, location: 'Lyon' });
    expect(prisma.investorProfile.update).toHaveBeenCalledWith({
      where: { id: 'i1' },
      data: { location: 'Lyon' },
      include: { user: true },
    });
  });

  it('DELETE /investors/:id returns 204', async () => {
    (prisma.investorProfile.delete as jest.Mock).mockResolvedValue({ id: 'i1' });
    const app = mountApp();
    const res = await request(app).delete('/investors/i1');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(prisma.investorProfile.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
  });

  it('GET /investors-search applies filters', async () => {
    (prisma.investorProfile.findMany as jest.Mock).mockResolvedValue([{ id: 'i2' }]);
    const app = mountApp();

    const res = await request(app)
      .get('/investors-search')
      .query({
        industry: Industry.AI,
        stagePreference: Stage.GROWTH,
        location: 'par',
        createdAt: '2025-01-01',
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'i2' }]);

    const call = (prisma.investorProfile.findMany as jest.Mock).mock.calls[0][0];
    expect(call.include).toEqual({ user: true });
    expect(call.orderBy).toEqual({ createdAt: 'desc' });
    expect(call.where.industries).toEqual({ has: Industry.AI });
    expect(call.where.stagePreference).toEqual({ has: Stage.GROWTH });
    expect(call.where.location).toEqual({ contains: 'par', mode: 'insensitive' });
    expect(call.where.createdAt.gte instanceof Date).toBe(true);
  });

  it('POST /investors returns 500 when service throws', async () => {
    (prisma.investorProfile.create as jest.Mock).mockRejectedValue(new Error('boom'));
    const app = mountApp(true);
    const res = await request(app).post('/investors').send({ location: 'Paris' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Server error creating investor profile.' });
  });
});
