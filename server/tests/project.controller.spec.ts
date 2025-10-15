import express from 'express';
import request from 'supertest';
import { ProjectController } from '../src/controllers/project.controller';

let svc: {
  getAll: jest.Mock;
  getById: jest.Mock;
  findStartupByUserId: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

jest.mock('../src/services/project.service', () => {
  svc = {
    getAll: jest.fn(),
    getById: jest.fn(),
    findStartupByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  return { ProjectService: jest.fn().mockImplementation(() => svc) };
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
  const controller = new ProjectController();
  app.get('/projects', controller.getAll.bind(controller));
  app.get('/projects/:id', controller.getById.bind(controller));
  app.post('/projects', controller.create.bind(controller));
  app.put('/projects/:id', controller.update.bind(controller));
  app.delete('/projects/:id', controller.delete.bind(controller));
  return app;
}

describe('ProjectController', () => {
  beforeEach(() => {
    Object.values(svc).forEach(fn => (fn as jest.Mock).mockReset());
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('GET /projects returns list', async () => {
    svc.getAll.mockResolvedValue([{ id: 'p1' }]);
    const res = await request(appWithUser()).get('/projects');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'p1' }]);
    expect(svc.getAll).toHaveBeenCalled();
  });

  it('GET /projects/:id returns one', async () => {
    svc.getById.mockResolvedValue({ id: 'p2' });
    const res = await request(appWithUser()).get('/projects/p2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'p2' });
    expect(svc.getById).toHaveBeenCalledWith('p2');
  });

  it('POST /projects -> 400 when user missing in token', async () => {
    const res = await request(appWithUser(null)).post('/projects').send({ title: 'X' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid or missing user in token.' });
    expect(svc.findStartupByUserId).not.toHaveBeenCalled();
  });

  it('POST /projects -> 404 when startup profile not found', async () => {
    svc.findStartupByUserId.mockResolvedValue(null);
    const res = await request(appWithUser('uX')).post('/projects').send({ title: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Startup profile not found.' });
    expect(svc.findStartupByUserId).toHaveBeenCalledWith('uX');
  });

  it('POST /projects -> 201 on success (uses startup id)', async () => {
    svc.findStartupByUserId.mockResolvedValue({ id: 'sp1' });
    svc.create.mockResolvedValue({ id: 'p3', startupId: 'sp1' });

    const payload = { title: 'Proj', description: 'Desc', industry: 'AI' };
    const res = await request(appWithUser('u1')).post('/projects').send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'p3', startupId: 'sp1' });
    expect(svc.create).toHaveBeenCalledWith('sp1', payload);
  });

  it('POST /projects -> 500 on service error', async () => {
    svc.findStartupByUserId.mockResolvedValue({ id: 'sp1' });
    svc.create.mockRejectedValue(new Error('boom'));

    const res = await request(appWithUser('u1')).post('/projects').send({ title: 'X' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error creating project.' });
  });

  it('PUT /projects/:id updates and returns entity', async () => {
    svc.update.mockResolvedValue({ id: 'p4', title: 'New' });
    const res = await request(appWithUser()).put('/projects/p4').send({ title: 'New' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'p4', title: 'New' });
    expect(svc.update).toHaveBeenCalledWith('p4', { title: 'New' });
  });

  it('DELETE /projects/:id returns 204', async () => {
    svc.delete.mockResolvedValue(undefined);
    const res = await request(appWithUser()).delete('/projects/p5');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(svc.delete).toHaveBeenCalledWith('p5');
  });
});
