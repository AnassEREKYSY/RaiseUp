import { ProjectService } from '../src/services/project.service';
import { prisma } from '../src/prisma';

jest.mock('../src/prisma', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    startupProfile: {
      findUnique: jest.fn(),
    },
  },
}));


describe('ProjectService', () => {
  const service = new ProjectService();

  beforeEach(() => jest.clearAllMocks());

  it('getAll includes startup and matches', async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValue([{ id: 'p1' }]);
    const res = await service.getAll();
    expect(prisma.project.findMany).toHaveBeenCalledWith({
      include: { startup: true, matches: true },
    });
    expect(res).toEqual([{ id: 'p1' }]);
  });

  it('getById includes startup and matches', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = await service.getById('p1');
    expect(prisma.project.findUnique).toHaveBeenCalledWith({
      where: { id: 'p1' },
      include: { startup: true, matches: true },
    });
    expect(res).toEqual({ id: 'p1' });
  });

  it('findStartupByUserId queries by userId', async () => {
    (prisma.startupProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'sp1', userId: 'u1' });
    const res = await service.findStartupByUserId('u1');
    expect(prisma.startupProfile.findUnique).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(res).toEqual({ id: 'sp1', userId: 'u1' });
  });

  it('create passes startupId and dto', async () => {
    (prisma.project.create as jest.Mock).mockResolvedValue({ id: 'p2' });
    const dto = { title: 'Proj', description: 'Desc', industry: 'AI' } as any;
    const res = await service.create('sp1', dto);
    expect(prisma.project.create).toHaveBeenCalledWith({ data: { ...dto, startupId: 'sp1' } });
    expect(res).toEqual({ id: 'p2' });
  });

  it('update updates by id', async () => {
    (prisma.project.update as jest.Mock).mockResolvedValue({ id: 'p1', title: 'New' });
    const res = await service.update('p1', { title: 'New' } as any);
    expect(prisma.project.update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { title: 'New' } });
    expect(res).toEqual({ id: 'p1', title: 'New' });
  });

  it('delete deletes by id', async () => {
    (prisma.project.delete as jest.Mock).mockResolvedValue({ id: 'p1' });
    const res = await service.delete('p1');
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
    expect(res).toEqual({ id: 'p1' });
  });
});
