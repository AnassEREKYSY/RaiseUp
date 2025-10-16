import express from 'express';
import request from 'supertest';

let svc = {
  getByUser: jest.fn(),
  create: jest.fn(),
  markAsRead: jest.fn(),
  delete: jest.fn(),
} as {
  getByUser: jest.Mock;
  create: jest.Mock;
  markAsRead: jest.Mock;
  delete: jest.Mock;
};

jest.mock('../src/services/notification.service', () => {
  const impl = {
    getByUser: jest.fn(),
    create: jest.fn(),
    markAsRead: jest.fn(),
    delete: jest.fn(),
  };
  (svc as any) = impl;
  return { NotificationService: jest.fn().mockImplementation(() => impl) };
});

const { NotificationController } = require('../src/controllers/notification.controller');

function buildApp() {
  const app = express();
  app.use(express.json());
  const controller = new NotificationController();
  app.get('/notifications/user/:userId', controller.getByUser.bind(controller));
  app.post('/notifications', controller.create.bind(controller));
  app.post('/notifications/:id/read', controller.markAsRead.bind(controller));
  app.delete('/notifications/:id', controller.delete.bind(controller));
  return app;
}

describe('NotificationController', () => {
  beforeEach(() => {
    svc.getByUser.mockReset();
    svc.create.mockReset();
    svc.markAsRead.mockReset();
    svc.delete.mockReset();
  });

  it('GET /notifications/user/:userId returns list', async () => {
    svc.getByUser.mockResolvedValue([{ id: 'n1' }]);
    const res = await request(buildApp()).get('/notifications/user/u1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'n1' }]);
    expect(svc.getByUser).toHaveBeenCalledWith('u1');
  });

  it('POST /notifications creates and returns 201', async () => {
    svc.create.mockResolvedValue({ id: 'n2' });
    const payload = { userId: 'u1', type: 'MESSAGE', message: 'Hi', isRead: false };
    const res = await request(buildApp()).post('/notifications').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'n2' });
    expect(svc.create).toHaveBeenCalledWith(payload);
  });

  it('POST /notifications/:id/read marks as read', async () => {
    svc.markAsRead.mockResolvedValue({ id: 'n3', isRead: true });
    const res = await request(buildApp()).post('/notifications/n3/read');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'n3', isRead: true });
    expect(svc.markAsRead).toHaveBeenCalledWith('n3');
  });

  it('DELETE /notifications/:id returns 204', async () => {
    svc.delete.mockResolvedValue(undefined);
    const res = await request(buildApp()).delete('/notifications/n4');
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect(svc.delete).toHaveBeenCalledWith('n4');
  });
});
