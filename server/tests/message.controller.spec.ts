import express from 'express';
import request from 'supertest';
import { prisma } from '../src/prisma';
import { MessageController } from '../src/controllers/message.controller';

let svcSpies: {
  getByMatch: jest.Mock;
  create: jest.Mock;
};

jest.mock('../src/services/message.service', () => {
  svcSpies = {
    getByMatch: jest.fn(),
    create: jest.fn(),
  };
  return {
    MessageService: jest.fn().mockImplementation(() => svcSpies),
  };
});

const notifyCreate = jest.fn();
jest.mock('../src/services/notification.service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    create: notifyCreate,
  })),
}));

jest.mock('../src/prisma', () => ({
  prisma: { match: { findUnique: jest.fn() } },
}));


function buildApp(userId: string | null = 'me1') {
  const app = express();
  app.use(express.json());
  if (userId) {
    app.use((req, _res, next) => {
      (req as any).user = { id: userId };
      next();
    });
  }
  const controller = new MessageController();
  app.get('/messages/:matchId', controller.getByMatch.bind(controller));
  app.post('/messages', controller.create.bind(controller));
  return app;
}

describe('MessageController', () => {
  beforeEach(() => {
    notifyCreate.mockReset();
    svcSpies.getByMatch.mockReset();
    svcSpies.create.mockReset();
    (prisma.match.findUnique as jest.Mock).mockReset();
  });

  it('GET /messages/:matchId forwards to service and returns list', async () => {
    svcSpies.getByMatch.mockResolvedValue([{ id: 'msg1' }]);
    const res = await request(buildApp()).get('/messages/m1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 'msg1' }]);
    expect(svcSpies.getByMatch).toHaveBeenCalledWith('m1');
  });

  it('POST /messages 400 when sender missing', async () => {
    const res = await request(buildApp(null)).post('/messages').send({ matchId: 'm1', content: 'hi' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'matchId and content required' });
    expect(svcSpies.create).not.toHaveBeenCalled();
  });

  it('POST /messages 400 when matchId or content missing', async () => {
    const app = buildApp('me1');
    let res = await request(app).post('/messages').send({ content: 'hi' });
    expect(res.status).toBe(400);
    res = await request(app).post('/messages').send({ matchId: 'm1' });
    expect(res.status).toBe(400);
    expect(svcSpies.create).not.toHaveBeenCalled();
  });

  it('POST /messages creates message and notifies recipient (sender investor)', async () => {
    svcSpies.create.mockResolvedValue({ id: 'msg2', matchId: 'm1', senderId: 'inv1', content: 'hello' });
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({ id: 'm1', investorId: 'inv1', startupId: 'st1' });

    const res = await request(buildApp('inv1')).post('/messages').send({ matchId: 'm1', content: 'hello' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 'msg2', matchId: 'm1', senderId: 'inv1', content: 'hello' });
    expect(svcSpies.create).toHaveBeenCalledWith({ matchId: 'm1', senderId: 'inv1', content: 'hello' });
    expect(notifyCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'st1', type: 'MESSAGE', message: 'New message received' })
    );
  });

  it('POST /messages creates message and notifies recipient (sender startup)', async () => {
    svcSpies.create.mockResolvedValue({ id: 'msg3', matchId: 'm2', senderId: 'st1', content: 'hey' });
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({ id: 'm2', investorId: 'inv1', startupId: 'st1' });

    const res = await request(buildApp('st1')).post('/messages').send({ matchId: 'm2', content: 'hey' });
    expect(res.status).toBe(201);
    expect(notifyCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'inv1', type: 'MESSAGE' })
    );
  });

  it('POST /messages no notify if match not found', async () => {
    svcSpies.create.mockResolvedValue({ id: 'msg4', matchId: 'm404', senderId: 'me1', content: 'yo' });
    (prisma.match.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request(buildApp('me1')).post('/messages').send({ matchId: 'm404', content: 'yo' });
    expect(res.status).toBe(201);
    expect(notifyCreate).not.toHaveBeenCalled();
  });
});
