import { AuthService } from '../src/services/auth.service';
import { Role } from '../src/models/enums';
import { prisma } from '../src/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../src/prisma', () => ({
  prisma: { user: { findUnique: jest.fn(), create: jest.fn() } },
}));

jest.mock('bcryptjs', () => ({ hash: jest.fn(), compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));

describe('AuthService', () => {
  const service = new AuthService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('creates a user and returns safe payload', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        fullName: 'John',
        password: 'hashed_pw',
        role: Role.STARTUP,
      });

      const res = await service.register({
        email: 'a@b.com',
        password: 'secret',
        fullName: 'John',
        role: Role.STARTUP,
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'a@b.com', fullName: 'John', password: 'hashed_pw', role: Role.STARTUP },
      });

      expect(res.message).toBe('User registered successfully');
      expect(res.user).toMatchObject({
        id: 'u1',
        email: 'a@b.com',
        fullName: 'John',
        role: Role.STARTUP,
        hasProfile: false,
      });
      expect((res.user as any).password).toBeUndefined();
    });

    it('throws when email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' });
      await expect(
        service.register({
          email: 'a@b.com',
          password: 'secret',
          fullName: 'John',
          role: Role.STARTUP,
        })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    const baseUser = {
      id: 'u1',
      email: 'a@b.com',
      fullName: 'John',
      password: 'hashed',
      role: Role.STARTUP,
      investorProfile: null,
      startupProfile: null,
    };

    it('returns token + user on valid credentials with hasProfile=false', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt-token');

      const res = await service.login({ email: 'a@b.com', password: 'pw' });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@b.com' },
        include: {
          investorProfile: { select: { id: true } },
          startupProfile: { select: { id: true } },
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('pw', 'hashed');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'u1', role: Role.STARTUP },
        'test_secret',
        { expiresIn: '7d' }
      );

      expect(res.token).toBe('jwt-token');
      expect(res.user).toMatchObject({
        id: 'u1',
        email: 'a@b.com',
        fullName: 'John',
        role: Role.STARTUP,
        hasProfile: false,
      });
      expect((res.user as any).password).toBeUndefined();
    });

    it('sets hasProfile=true when profile exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...baseUser,
        startupProfile: { id: 'sp1' },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt2');

      const res = await service.login({ email: 'a@b.com', password: 'pw' });
      expect(res.user.hasProfile).toBe(true);
    });

    it('throws on missing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.login({ email: 'no@no.com', password: 'pw' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('throws on invalid password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login({ email: 'a@b.com', password: 'bad' }))
        .rejects.toThrow('Invalid credentials');
    });
  });
});
