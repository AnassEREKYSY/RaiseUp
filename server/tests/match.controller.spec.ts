import express from 'express';
import request from 'supertest';

const methodSpies = {
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
  getOrCreateForUsers: jest.fn(),
  requestMatch: jest.fn(),
  acceptMatch: jest.fn(),
  rejectMatch: jest.fn(),
};

jest.mock('../src/services/match.service', () => ({
  MatchService: jest.fn().mockImplementation(() => methodSpies),
}));

import { MatchController } from '../src/controllers/match.controller';

function appWithUser(userId: string | null = 'me-1') {
  const app = express();
  const controller = new MatchController();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (userId) (req as any).user = { id: userId };
    next();
  });

  app.get('/matches', controller.getAll.bind(controller));
  app.get('/matches/:id', controller.getById.bind(controller));
  app.post('/matches', controller.create.bind(controller));
  app.patch('/matches/:id/status', controller.updateStatus.bind(controller));
  app.delete('/matches/:id', controller.delete.bind(controller));
  app.post('/matches/get-or-create', controller.getOrCreate.bind(controller));
  app.post('/matches/request', controller.request.bind(controller));
  app.post('/matches/:id/accept', controller.accept.bind(controller));
  app.post('/matches/:id/reject', controller.reject.bind(controller));

  return app;
}

describe('MatchController', () => {
  beforeEach(() => {
    Object.values(methodSpies).forEach((fn) => (fn as jest.Mock).mockReset());
  });

  it('GET /matches returns all', async () => {
    methodSpies.getAll.mockResolvedValue([{ id: 'm1' }]);
    const res = await request(appWithUser()).get('/matches');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'm1' }]);
    expect(methodSpies.getAll).toHaveBeenCalled();
  });

  it('GET /matches/:id returns one', async () => {
    methodSpies.getById.mockResolvedValue({ id: 'm2' });
    const res = await request(appWithUser()).get('/matches/m2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'm2' });
    expect(methodSpies.getById).toHaveBeenCalledWith('m2');
  });

  it('POST /matches creates (201)', async () => {
    methodSpies.create.mockResolvedValue({ id: 'm3' });
    const payload = { startupId: 's1', investorId: 'i1' };
    const res = await request(appWithUser()).post('/matches').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'm3' });
    expect(methodSpies.create).toHaveBeenCalledWith(payload);
  });

  it('PATCH /matches/:id/status updates and returns entity', async () => {
    methodSpies.updateStatus.mockResolvedValue({ id: 'm4', status: 'ACCEPTED' });
    const res = await request(appWithUser()).patch('/matches/m4/status').send({ status: 'ACCEPTED' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'm4', status: 'ACCEPTED' });
    expect(methodSpies.updateStatus).toHaveBeenCalledWith('m4', { status: 'ACCEPTED' });
  });

  it('DELETE /matches/:id returns 204', async () => {
    methodSpies.delete.mockResolvedValue(undefined);
    const res = await request(appWithUser()).delete('/matches/m5');
    expect(res.status).toBe(204);
    expect(methodSpies.delete).toHaveBeenCalledWith('m5');
  });

  it('POST /matches/get-or-create requires targetUserId', async () => {
    const res = await request(appWithUser()).post('/matches/get-or-create').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'targetUserId required' });
    expect(methodSpies.getOrCreateForUsers).not.toHaveBeenCalled();
  });

  it('POST /matches/get-or-create forwards meId + body to service', async () => {
    methodSpies.getOrCreateForUsers.mockResolvedValue({ id: 'm6' });
    const res = await request(appWithUser('meX'))
      .post('/matches/get-or-create')
      .send({ targetUserId: 't1', projectId: 'p1', investorProfileId: 'ip1' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'm6' });
    expect(methodSpies.getOrCreateForUsers).toHaveBeenCalledWith({
      meId: 'meX',
      targetUserId: 't1',
      projectId: 'p1',
      investorProfileId: 'ip1',
    });
  });

  it('POST /matches/request requires targetUserId', async () => {
    const res = await request(appWithUser()).post('/matches/request').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'targetUserId required' });
    expect(methodSpies.requestMatch).not.toHaveBeenCalled();
  });

  it('POST /matches/request returns 201', async () => {
    methodSpies.requestMatch.mockResolvedValue({ id: 'm7' });
    const res = await request(appWithUser('meY'))
      .post('/matches/request')
      .send({ targetUserId: 't2', projectId: 'p2', investorProfileId: 'ip2' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'm7' });
    expect(methodSpies.requestMatch).toHaveBeenCalledWith({
      meId: 'meY',
      targetUserId: 't2',
      projectId: 'p2',
      investorProfileId: 'ip2',
    });
  });

  it('POST /matches/:id/accept returns 200', async () => {
    methodSpies.acceptMatch.mockResolvedValue({ id: 'm8', status: 'ACCEPTED' });
    const res = await request(appWithUser('meZ')).post('/matches/m8/accept');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'm8', status: 'ACCEPTED' });
    expect(methodSpies.acceptMatch).toHaveBeenCalledWith({ meId: 'meZ', matchId: 'm8' });
  });

  it('POST /matches/:id/reject returns 204', async () => {
    methodSpies.rejectMatch.mockResolvedValue(undefined);
    const res = await request(appWithUser('meZ')).post('/matches/m9/reject');
    expect(res.status).toBe(204);
    expect(methodSpies.rejectMatch).toHaveBeenCalledWith({ meId: 'meZ', matchId: 'm9' });
  });
});
