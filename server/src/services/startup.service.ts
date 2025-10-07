import { prisma } from '../prisma';
import { CreateStartupDto, UpdateStartupDto } from '../dtos/startup.dto';
import { Industry, Stage } from '../models/enums';

export class StartupService {
  async getAll() {
    return prisma.startupProfile.findMany({ include: { user: true, projects: true } });
  }

  async getById(id: string) {
    return prisma.startupProfile.findUnique({ where: { id }, include: { user: true, projects: true } });
  }

  async create(userId: string, data: CreateStartupDto) {
    return prisma.startupProfile.create({
      data: { ...data, userId }
    });
  }

  async update(id: string, data: UpdateStartupDto) {
    return prisma.startupProfile.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.startupProfile.delete({ where: { id } });
  }

  async search(filters: {industry?: Industry;stage?: Stage;fundingNeeded?: number;country?: string;createdAt?: string}) {
    return prisma.startupProfile.findMany({
      where: {
        ...(filters.industry ? { industry: filters.industry } : {}),
        ...(filters.stage ? { stage: filters.stage } : {}),
        ...(filters.country ? { country: { contains: filters.country, mode: 'insensitive' } } : {}),
        ...(filters.fundingNeeded ? { fundingNeeded: { lte: filters.fundingNeeded } } : {}),
        ...(filters.createdAt ? { createdAt: { gte: new Date(filters.createdAt) } } : {}),
      },
      include: { user: true, projects: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
