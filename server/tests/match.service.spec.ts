import { MatchStatus, Role } from '../src/models/enums';

jest.mock('../src/prisma', () => ({
  prisma: {
    match: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const mockNotifyCreate = jest.fn().mockResolvedValue({ id: 'notif1' });
jest.mock('../src/services/notification.service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    create: mockNotifyCreate,
  })),
}));

import { prisma } from '../src/prisma';
import { MatchService } from '../src/services/match.service';

describe('MatchService', () => {
  const service = new MatchService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAll includes startup, investor, project', async () => {
    (prisma.match.findMany as jest.Mock).mockResolvedValue([{ id: 'm1' }]);
    const res = await service.getAll();
    expect(prisma.match.findMany).toHaveBeenCalledWith({
      include: { startup: true, investor: true, project: true },
    });
    expect(res).toEqual([{ id: 'm1' }]);
  });

    it('getById includes startup, investor, project, messages', async () => {
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({ id: 'm1' });
    const res = await service.getById('m1');
    expect(prisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'm1' },
        include: {
        startup: true,
        investor: true,
        project: true,
        messages: true,
        },
    });
    expect(res).toEqual({ id: 'm1' });
    });

  it('create sets status=PENDING and nullifies optional ids', async () => {
    (prisma.match.create as jest.Mock).mockResolvedValue({ id: 'm1' });
    const res = await service.create({
      startupId: 's1',
      investorId: 'i1',
      projectId: undefined,
      investorProfileId: undefined,
    } as any);
    expect(prisma.match.create).toHaveBeenCalledWith({
      data: {
        startupId: 's1',
        investorId: 'i1',
        projectId: null,
        investorProfileId: null,
        status: MatchStatus.PENDING,
      },
    });
    expect(res).toEqual({ id: 'm1' });
  });

  it('updateStatus updates status only', async () => {
    (prisma.match.update as jest.Mock).mockResolvedValue({ id: 'm1', status: MatchStatus.ACCEPTED });
    const res = await service.updateStatus('m1', { status: MatchStatus.ACCEPTED });
    expect(prisma.match.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { status: MatchStatus.ACCEPTED },
    });
    expect(res).toEqual({ id: 'm1', status: MatchStatus.ACCEPTED });
  });

  it('delete removes match', async () => {
    (prisma.match.delete as jest.Mock).mockResolvedValue({ id: 'm1' });
    const res = await service.delete('m1');
    expect(prisma.match.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    expect(res).toEqual({ id: 'm1' });
  });

  describe('getOrCreateForUsers', () => {
    it('returns existing (either direction) with messages include', async () => {
      (prisma.match.findFirst as jest.Mock).mockResolvedValue({ id: 'mX' });
      const res = await service.getOrCreateForUsers({
        meId: 'u1',
        targetUserId: 'u2',
        projectId: 'p1',
        investorProfileId: undefined,
      });
      expect(res).toEqual({ id: 'mX' });
      const call = (prisma.match.findFirst as jest.Mock).mock.calls[0][0];
      expect(call.where.OR).toHaveLength(2);
      expect(call.include.messages).toBeDefined();
    });

    it('creates new with roles deduced from me.role', async () => {
      (prisma.match.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.STARTUP });
      (prisma.match.create as jest.Mock).mockResolvedValue({ id: 'mNew' });

      const res = await service.getOrCreateForUsers({
        meId: 'meS',
        targetUserId: 'investorU',
        projectId: undefined,
        investorProfileId: 'invp1',
      });

      expect(prisma.match.create).toHaveBeenCalledWith({
        data: {
          startupId: 'meS',
          investorId: 'investorU',
          projectId: null,
          investorProfileId: 'invp1',
          status: MatchStatus.PENDING,
        },
        include: {
          startup: true,
          investor: true,
          project: true,
          messages: { orderBy: { createdAt: 'asc' }, include: { sender: true } },
        },
      });
      expect(res).toEqual({ id: 'mNew' });
    });
  });

  describe('requestMatch', () => {
    it('returns existing when already present (not REJECTED) and does NOT notify', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.STARTUP });
      (prisma.match.findFirst as jest.Mock).mockResolvedValue({
        id: 'm1',
        startupId: 'meS',
        investorId: 'invU',
        status: MatchStatus.PENDING,
      });
      const res = await service.requestMatch({
        meId: 'meS',
        targetUserId: 'invU',
        projectId: undefined,
        investorProfileId: undefined,
      });
      expect(res.id).toBe('m1');
      expect(mockNotifyCreate).not.toHaveBeenCalled();
    });

    it('reopens REJECTED -> PENDING and notifies counterparty', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.STARTUP });
      (prisma.match.findFirst as jest.Mock).mockResolvedValue({
        id: 'm1',
        startupId: 'meS',
        investorId: 'invU',
        status: MatchStatus.REJECTED,
      });
      (prisma.match.update as jest.Mock).mockResolvedValue({
        id: 'm1',
        startupId: 'meS',
        investorId: 'invU',
        status: MatchStatus.PENDING,
      });

      const res = await service.requestMatch({
        meId: 'meS',
        targetUserId: 'invU',
        projectId: undefined,
        investorProfileId: undefined,
      });

      expect(prisma.match.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { status: MatchStatus.PENDING },
        include: { startup: true, investor: true },
      });
      expect(res.status).toBe(MatchStatus.PENDING);
      expect(mockNotifyCreate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'invU', type: 'MATCH_REQUEST' })
      );
    });

    it('creates new pending and notifies counterparty', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: Role.INVESTOR });
      (prisma.match.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.match.create as jest.Mock).mockResolvedValue({
        id: 'm2',
        startupId: 'sU',
        investorId: 'meI',
        status: MatchStatus.PENDING,
      });

      const res = await service.requestMatch({
        meId: 'meI',
        targetUserId: 'sU',
        projectId: 'p1',
        investorProfileId: 'ip1',
      });

      expect(prisma.match.create).toHaveBeenCalledWith({
        data: {
          startupId: 'sU',
          investorId: 'meI',
          projectId: 'p1',
          investorProfileId: 'ip1',
          status: MatchStatus.PENDING,
        },
        include: { startup: true, investor: true },
      });
      expect(res.id).toBe('m2');
      expect(mockNotifyCreate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'sU', type: 'MATCH_REQUEST' })
      );
    });
  });

  describe('acceptMatch', () => {
    it('throws if match not found', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.acceptMatch({ meId: 'u1', matchId: 'mX' })).rejects.toThrow('Match not found');
    });

    it('throws if not participant', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue({
        id: 'm1', startupId: 's1', investorId: 'i1', status: MatchStatus.PENDING,
      });
      await expect(service.acceptMatch({ meId: 'uZ', matchId: 'm1' })).rejects.toThrow('Not authorized');
    });

    it('throws if status not PENDING', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue({
        id: 'm1', startupId: 's1', investorId: 'i1', status: MatchStatus.ACCEPTED,
      });
      await expect(service.acceptMatch({ meId: 's1', matchId: 'm1' })).rejects.toThrow('Match is not pending');
    });

    it('accepts and notifies counterparty', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue({
        id: 'm1', startupId: 's1', investorId: 'i1', status: MatchStatus.PENDING,
      });
      (prisma.match.update as jest.Mock).mockResolvedValue({
        id: 'm1', status: MatchStatus.ACCEPTED,
      });
      const res = await service.acceptMatch({ meId: 'i1', matchId: 'm1' });
      expect(prisma.match.update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { status: MatchStatus.ACCEPTED },
      });
      // me=i1 -> counterparty=s1
      expect(mockNotifyCreate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 's1', type: 'MATCH_ACCEPTED' })
      );
      expect(res).toEqual({ id: 'm1', status: MatchStatus.ACCEPTED });
    });
  });

  describe('rejectMatch', () => {
    it('throws if not found', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.rejectMatch({ meId: 'u1', matchId: 'mX' })).rejects.toThrow('Match not found');
    });

    it('throws if not participant', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue({
        id: 'm1', startupId: 's1', investorId: 'i1', status: MatchStatus.PENDING,
      });
      await expect(service.rejectMatch({ meId: 'uZ', matchId: 'm1' })).rejects.toThrow('Not authorized');
    });

    it('deletes and notifies counterparty', async () => {
      (prisma.match.findUnique as jest.Mock).mockResolvedValue({
        id: 'm1', startupId: 's1', investorId: 'i1', status: MatchStatus.PENDING,
      });
      (prisma.match.delete as jest.Mock).mockResolvedValue({ id: 'm1' });
      await service.rejectMatch({ meId: 's1', matchId: 'm1' });
      expect(prisma.match.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
      expect(mockNotifyCreate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'i1', type: 'MATCH_REJECTED' })
      );
    });
  });
});
