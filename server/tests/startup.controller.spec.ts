import express from 'express';
import request from 'supertest';
import { Industry, Stage } from '../src/models/enums';
import { StartupController } from '../src/controllers/startup.controller';

let svc: {
  getAll: jest.Mock;
  getById: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  search: jest.Mock;
};

jest.mock('../src/services/startup.service', () => {
  svc = {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    search: jest.fn(),
  };
  return { StartupService: jest.fn().mockImplementation(() => svc) };
});


function appWithUser(userId: string | null = 'u1') {
  const app = express();
  app.use(express.json());
  if (userId) {
    app.use((req, _res, next) => {
      (req as any).user = { id: userId };
      next();
    });
  }
  const controller = new StartupController();
  app.get('/startups', controller.getAll.bind(controller));
  app.get('/startups/:id', controller.getById.bind(controller));
  app.post('/startups', controller.create.bind(controller));
  app.put('/startups/:id', controller.update.bind(controller));
  app.delete('/startups/:id', controller.delete.bind(controller));
  app.get('/startups-search', controller.search.bind(controller));
  return app;
}

describe('StartupController', () => {
  beforeEach(() => {
    Object.values(svc).forEach(fn => (fn as jest.Mock).mockReset());
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('GET /startups returns list', async () => {
    svc.getAll.mockResolvedValue([{ id: 's1' }]);
    const res = await request(appWithUser()).get('/startups');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 's1' }]);
    expect(svc.getAll).toHaveBeenCalled();
  });

  it('GET /startups/:id returns one', async () => {
    svc.getById.mockResolvedValue({ id: 's2' });
    const res = await request(appWithUser()).get('/startups/s2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 's2' });
    expect(svc.getById).toHaveBeenCalledWith('s2');
  });

  it('POST /startups -> 400 when user missing', async () => {
    const res = await request(appWithUser(null)).post('/startups').send({ companyName: 'X' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid or missing user in token.' });
    expect(svc.create).not.toHaveBeenCalled();
  });

  it('POST /startups -> 201 creates and adds hasProfile=true', async () => {
    svc.create.mockResolvedValue({ id: 's3', userId: 'u1' });
    const payload = {
      companyName: 'Acme',
      industry: Industry.AI,
      stage: Stage.MVP,
      fundingNeeded: 20000,
      country: 'FR',
    };
    const res = await request(appWithUser('u1')).post('/startups').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 's3', userId: 'u1', hasProfile: true });
    expect(svc.create).toHaveBeenCalledWith('u1', payload);
  });

  it('POST /startups -> 500 when service throws', async () => {
    svc.create.mockRejectedValue(new Error('boom'));
    const res = await request(appWithUser('u1')).post('/startups').send({ companyName: 'X' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Server error creating startup profile.' });
  });

  it('PUT /startups/:id updates entity', async () => {
    svc.update.mockResolvedValue({ id: 's4', country: 'MA' });
    const res = await request(appWithUser()).put('/startups/s4').send({ country: 'MA' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 's4', country: 'MA' });
    expect(svc.update).toHaveBeenCalledWith('s4', { country: 'MA' });
  });

  it('DELETE /startups/:id returns 204', async () => {
    svc.delete.mockResolvedValue(undefined);
    const res = await request(appWithUser()).delete('/startups/s5');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(svc.delete).toHaveBeenCalledWith('s5');
  });

  it('GET /startups-search passes parsed filters', async () => {
    svc.search.mockResolvedValue([{ id: 's6' }]);
    const res = await request(appWithUser())
      .get('/startups-search')
      .query({
        industry: Industry.FINTECH,
        stage: Stage.GROWTH,
        fundingNeeded: '75000',
        country: 'par',
        createdAt: '2025-02-01',
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 's6' }]);
    expect(svc.search).toHaveBeenCalledWith({
      industry: Industry.FINTECH,
      stage: Stage.GROWTH,
      fundingNeeded: 75000,
      country: 'par',
      createdAt: '2025-02-01',
    });
  });
});
