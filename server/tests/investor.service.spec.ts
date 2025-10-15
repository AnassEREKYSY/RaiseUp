import { InvestorService } from '../src/services/investor.service';
import { Industry, Stage } from '../src/models/enums';
import { prisma } from '../src/prisma';

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

describe('InvestorService', () => {
  const service = new InvestorService();

  beforeEach(() => jest.clearAllMocks());

  it('getAll calls prisma with include user+matches', async () => {
    (prisma.investorProfile.findMany as jest.Mock).mockResolvedValue([{ id: 'i1' }]);
    const res = await service.getAll();
    expect(prisma.investorProfile.findMany).toHaveBeenCalledWith({
      include: { user: true, matches: true },
    });
    expect(res).toEqual([{ id: 'i1' }]);
  });

  it('getById calls prisma with where id + include', async () => {
    (prisma.investorProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'i1' });
    const res = await service.getById('i1');
    expect(prisma.investorProfile.findUnique).toHaveBeenCalledWith({
      where: { id: 'i1' },
      include: { user: true, matches: true },
    });
    expect(res).toEqual({ id: 'i1' });
  });

  it('create passes through userId and dto', async () => {
    (prisma.investorProfile.create as jest.Mock).mockResolvedValue({ id: 'i1' });
    const dto = {
      companyName: 'VC One',
      industries: [Industry.FINTECH, Industry.AI],
      stagePreference: [Stage.MVP, Stage.GROWTH],
      location: 'Paris',
      website: 'https://vc.one',
      bio: 'We invest seed->A',
    };
    const res = await service.create('u1', dto as any);
    expect(prisma.investorProfile.create).toHaveBeenCalledWith({
      data: { ...dto, userId: 'u1' },
    });
    expect(res).toEqual({ id: 'i1' });
  });

  it('update calls prisma.update with include user', async () => {
    (prisma.investorProfile.update as jest.Mock).mockResolvedValue({ id: 'i1', user: { id: 'u1' } });
    const res = await service.update('i1', { location: 'Lyon' } as any);
    expect(prisma.investorProfile.update).toHaveBeenCalledWith({
      where: { id: 'i1' },
      data: { location: 'Lyon' },
      include: { user: true },
    });
    expect(res).toEqual({ id: 'i1', user: { id: 'u1' } });
  });

  it('delete calls prisma.delete by id', async () => {
    (prisma.investorProfile.delete as jest.Mock).mockResolvedValue({ id: 'i1' });
    const res = await service.delete('i1');
    expect(prisma.investorProfile.delete).toHaveBeenCalledWith({ where: { id: 'i1' } });
    expect(res).toEqual({ id: 'i1' });
  });

  describe('search', () => {
    it('no filters -> just include + orderBy', async () => {
      (prisma.investorProfile.findMany as jest.Mock).mockResolvedValue([]);
      await service.search({});
      expect(prisma.investorProfile.findMany).toHaveBeenCalledWith({
        where: {},
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('applies industry + stagePreference + location + createdAt', async () => {
      (prisma.investorProfile.findMany as jest.Mock).mockResolvedValue([]);
      const createdAt = '2025-01-01';
      await service.search({
        industry: Industry.AI,
        stagePreference: Stage.GROWTH,
        location: 'par',
        createdAt,
      });

      const call = (prisma.investorProfile.findMany as jest.Mock).mock.calls[0][0];
      expect(call.include).toEqual({ user: true });
      expect(call.orderBy).toEqual({ createdAt: 'desc' });

      expect(call.where.industries).toEqual({ has: Industry.AI });
      expect(call.where.stagePreference).toEqual({ has: Stage.GROWTH });
      expect(call.where.location).toEqual({ contains: 'par', mode: 'insensitive' });
      expect(call.where.createdAt.gte instanceof Date).toBe(true);
      expect(call.where.createdAt.gte.toISOString().startsWith('2025-01-01')).toBe(true);
    });
  });
});
