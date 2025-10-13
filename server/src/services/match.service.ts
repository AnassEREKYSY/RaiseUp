import { prisma } from '../prisma';
import { CreateMatchDto, UpdateMatchStatusDto } from '../dtos/match.dto';
import { MatchStatus, Role } from '../models/enums';

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
        projectId: data.projectId,
        investorProfileId: data.investorProfileId,
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
          { startupId: targetUserId, investorId: meId, projectId: projectId ?? undefined },
        ],
      },
      include: {
        startup: true,
        investor: true,
        project: true,
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: true } }
      },
    });
    if (existing) return existing;

    const me = await prisma.user.findUnique({ where: { id: meId }, select: { role: true } });
    const startupId = me?.role === Role.STARTUP ? meId : targetUserId;
    const investorId = me?.role === Role.INVESTOR ? meId : targetUserId;

    return prisma.match.create({
      data: { startupId, investorId, projectId, investorProfileId, status: MatchStatus.PENDING },
      include: {
        startup: true,
        investor: true,
        project: true,
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: true } }
      },
    });
  }
}
