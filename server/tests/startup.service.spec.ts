import { StartupService } from '../src/services/startup.service';
import { Industry, Stage } from '../src/models/enums';
import { prisma } from '../src/prisma';

jest.mock('../src/prisma', () => ({
  prisma: {
    startupProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));


describe('StartupService', () => {
  const service = new StartupService();
  beforeEach(() => jest.clearAllMocks());

  it('getAll includes user + projects', async () => {
    (prisma.startupProfile.findMany as jest.Mock).mockResolvedValue([{ id: 's1' }]);
    const res = await service.getAll();
    expect(prisma.startupProfile.findMany).toHaveBeenCalledWith({
      include: { user: true, projects: true },
    });
    expect(res).toEqual([{ id: 's1' }]);
  });

  it('getById includes user + projects', async () => {
    (prisma.startupProfile.findUnique as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = await service.getById('s1');
    expect(prisma.startupProfile.findUnique).toHaveBeenCalledWith({
      where: { id: 's1' },
      include: { user: true, projects: true },
    });
    expect(res).toEqual({ id: 's1' });
  });

  it('create passes userId and dto', async () => {
    (prisma.startupProfile.create as jest.Mock).mockResolvedValue({ id: 's2' });
    const dto = {
      companyName: 'Acme',
      description: 'desc',
      industry: Industry.AI,
      stage: Stage.MVP,
      fundingNeeded: 100000,
      country: 'FR',
      website: 'https://acme.io',
      traction: '1000 users',
      pitchDeckUrl: 'http://deck',
    } as any;
    const res = await service.create('u1', dto);
    expect(prisma.startupProfile.create).toHaveBeenCalledWith({
      data: { ...dto, userId: 'u1' },
    });
    expect(res).toEqual({ id: 's2' });
  });

  it('update includes user + projects', async () => {
    (prisma.startupProfile.update as jest.Mock).mockResolvedValue({ id: 's1', user: {}, projects: [] });
    const res = await service.update('s1', { country: 'MA' } as any);
    expect(prisma.startupProfile.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { country: 'MA' },
      include: { user: true, projects: true },
    });
    expect(res).toEqual({ id: 's1', user: {}, projects: [] });
  });

  it('delete removes by id', async () => {
    (prisma.startupProfile.delete as jest.Mock).mockResolvedValue({ id: 's1' });
    const res = await service.delete('s1');
    expect(prisma.startupProfile.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    expect(res).toEqual({ id: 's1' });
  });

  describe('search', () => {
    it('no filters -> empty where, include + orderBy', async () => {
      (prisma.startupProfile.findMany as jest.Mock).mockResolvedValue([]);
      await service.search({});
      expect(prisma.startupProfile.findMany).toHaveBeenCalledWith({
        where: {},
        include: { user: true, projects: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('applies industry, stage, country (insensitive), fundingNeeded (lte), createdAt (gte)', async () => {
      (prisma.startupProfile.findMany as jest.Mock).mockResolvedValue([]);
      const createdAt = '2025-01-10';
      await service.search({
        industry: Industry.FINTECH,
        stage: Stage.GROWTH,
        country: 'paR',
        fundingNeeded: 50000,
        createdAt,
      });

      const args = (prisma.startupProfile.findMany as jest.Mock).mock.calls[0][0];
      expect(args.include).toEqual({ user: true, projects: true });
      expect(args.orderBy).toEqual({ createdAt: 'desc' });
      expect(args.where.industry).toBe(Industry.FINTECH);
      expect(args.where.stage).toBe(Stage.GROWTH);
      expect(args.where.country).toEqual({ contains: 'paR', mode: 'insensitive' });
      expect(args.where.fundingNeeded).toEqual({ lte: 50000 });
      expect(args.where.createdAt.gte instanceof Date).toBe(true);
      expect(args.where.createdAt.gte.toISOString().startsWith('2025-01-10')).toBe(true);
    });
  });
});
