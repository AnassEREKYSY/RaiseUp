import express from 'express';
import request from 'supertest';
import { prisma } from '../src/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRouter from '../src/routes/auth.routes';
import { Role } from '../src/models/enums';

jest.mock('../src/prisma', () => ({
  prisma: { user: { findUnique: jest.fn(), create: jest.fn() } },
}));
jest.mock('bcryptjs', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  return app;
}

describe('AuthController + routes', () => {
  const app = makeApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('201 on success', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        fullName: 'John',
        password: 'hashed_pw',
        role: Role.STARTUP,
      });

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'a@b.com', password: 'secret', fullName: 'John', role: Role.STARTUP });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.user).toMatchObject({
        id: 'u1',
        email: 'a@b.com',
        fullName: 'John',
        role: Role.STARTUP,
        hasProfile: false,
      });
    });

    it('400 on duplicate email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'exists' });

      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'a@b.com', password: 'secret', fullName: 'John', role: Role.STARTUP });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email already registered');
    });
  });

  describe('POST /auth/login', () => {
    it('200 on success returns token + user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        fullName: 'John',
        password: 'hashed',
        role: Role.STARTUP,
        investorProfile: null,
        startupProfile: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'a@b.com', password: 'pw' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe('jwt-token');
      expect(res.body.user).toMatchObject({
        id: 'u1',
        email: 'a@b.com',
        fullName: 'John',
        role: Role.STARTUP,
        hasProfile: false,
      });
    });

    it('401 on invalid credentials (no user)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'no@no.com', password: 'pw' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('401 on invalid credentials (wrong password)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        fullName: 'John',
        password: 'hashed',
        role: Role.STARTUP,
        investorProfile: null,
        startupProfile: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'a@b.com', password: 'bad' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });
});
