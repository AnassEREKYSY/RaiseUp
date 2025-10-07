import { prisma } from '../prisma';
import { CreateMatchDto, UpdateMatchStatusDto } from '../dtos/match.dto';
import { MatchStatus } from '../models/enums';

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
}
