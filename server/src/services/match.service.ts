import { prisma } from '../prisma';
import { CreateMatchDto, UpdateMatchStatusDto } from '../dtos/match.dto';
import { MatchStatus, Role } from '../models/enums';
import { NotificationService } from './notification.service';
import { GetOrCreateArgs } from '../types/getOrCreateArgs.type';
import { DecisionArgs } from '../types/desicionArgs.type';

const notifications = new NotificationService();

export class MatchService {
  async getAll() {
    return prisma.match.findMany({ include: { startup: true, investor: true, project: true } });
  }

  async getById(id: string) {
    return prisma.match.findUnique({
      where: { id },
      include: { startup: true, investor: true, project: true, messages: true }
    });
  }

  async create(data: CreateMatchDto) {
    return prisma.match.create({
      data: {
        startupId: data.startupId,
        investorId: data.investorId,
        projectId: data.projectId ?? null,
        investorProfileId: data.investorProfileId ?? null,
        status: MatchStatus.PENDING
      }
    });
  }

  async updateStatus(id: string, data: UpdateMatchStatusDto) {
    return prisma.match.update({
      where: { id },
      data: { status: data.status }
    });
  }

  async delete(id: string) {
    return prisma.match.delete({ where: { id } });
  }

  async getOrCreateForUsers({ meId, targetUserId, projectId, investorProfileId }: GetOrCreateArgs) {
    const existing = await prisma.match.findFirst({
      where: {
        OR: [
          { startupId: meId, investorId: targetUserId, projectId: projectId ?? undefined },
          { startupId: targetUserId, investorId: meId, projectId: projectId ?? undefined }
        ]
      },
      include: {
        startup: true,
        investor: true,
        project: true,
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: true } }
      }
    });
    if (existing) return existing;

    const me = await prisma.user.findUnique({ where: { id: meId }, select: { role: true } });
    const startupId = me?.role === Role.STARTUP ? meId : targetUserId;
    const investorId = me?.role === Role.INVESTOR ? meId : targetUserId;

    return prisma.match.create({
      data: {
        startupId,
        investorId,
        projectId: projectId ?? null,
        investorProfileId: investorProfileId ?? null,
        status: MatchStatus.PENDING
      },
      include: {
        startup: true,
        investor: true,
        project: true,
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: true } }
      }
    });
  }

  async requestMatch({ meId, targetUserId, projectId, investorProfileId }: GetOrCreateArgs) {
    const { startupId, investorId } = await this.resolveRoles(meId, targetUserId);

    const existing = await prisma.match.findFirst({
      where: { startupId, investorId, projectId: projectId ?? undefined },
      include: { startup: true, investor: true }
    });

    if (existing) {
      if (existing.status === MatchStatus.REJECTED) {
        const reopened = await prisma.match.update({
          where: { id: existing.id },
          data: { status: MatchStatus.PENDING },
          include: { startup: true, investor: true }
        });
        await this.notifyOnRequest(reopened, meId);
        return reopened;
      }
      return existing;
    }

    const created = await prisma.match.create({
      data: {
        startupId,
        investorId,
        projectId: projectId ?? null,
        investorProfileId: investorProfileId ?? null,
        status: MatchStatus.PENDING
      },
      include: { startup: true, investor: true }
    });

    await this.notifyOnRequest(created, meId);
    return created;
  }

  async acceptMatch({ meId, matchId }: DecisionArgs) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error('Match not found');

    const isParticipant = meId === match.startupId || meId === match.investorId;
    if (!isParticipant) throw new Error('Not authorized');

    if (match.status !== MatchStatus.PENDING) throw new Error('Match is not pending');

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.ACCEPTED }
    });

    const counterpartyId = meId === match.investorId ? match.startupId : match.investorId;
    await notifications.create({
      userId: counterpartyId,
      type: 'MATCH_ACCEPTED',
      message: 'Your match request was accepted'
    } as any);

    return updated;
  }

  async rejectMatch({ meId, matchId }: DecisionArgs) {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new Error('Match not found');

    const isParticipant = meId === match.startupId || meId === match.investorId;
    if (!isParticipant) throw new Error('Not authorized');

    await prisma.match.delete({ where: { id: matchId } });

    const counterpartyId = meId === match.investorId ? match.startupId : match.investorId;
    await notifications.create({
      userId: counterpartyId,
      type: 'MATCH_REJECTED',
      message: 'Your match request was rejected'
    } as any);
  }

  private async resolveRoles(meId: string, targetUserId: string) {
    const me = await prisma.user.findUnique({ where: { id: meId }, select: { role: true } });
    const startupId = me?.role === Role.STARTUP ? meId : targetUserId;
    const investorId = me?.role === Role.INVESTOR ? meId : targetUserId;
    return { startupId, investorId };
  }

  private async notifyOnRequest(match: { investorId: string; startupId: string }, requesterId: string) {
    const recipientId = requesterId === match.investorId ? match.startupId : match.investorId;
    await notifications.create({
      userId: recipientId,
      type: 'MATCH_REQUEST',
      message: 'New match request'
    } as any);
  }
}
