import { prisma } from '../prisma';
import { CreateInvestorDto, UpdateInvestorDto } from '../dtos/investor.dto';
import { Industry, Stage } from '../models/enums';

export class InvestorService {
  async getAll() {
    return prisma.investorProfile.findMany({ include: { user: true, matches: true } });
  }

  async getById(id: string) {
    return prisma.investorProfile.findUnique({ where: { id }, include: { user: true, matches: true } });
  }

  async create(userId: string, data: CreateInvestorDto) {
    return prisma.investorProfile.create({
      data: { ...data, userId }
    });
  }

  async update(id: string, data: UpdateInvestorDto) {
    return prisma.investorProfile.update({
      where: { id },
      data,
      include: { user: true }
    });
  }

  async delete(id: string) {
    return prisma.investorProfile.delete({ where: { id } });
  }

  async search(filters: {industry?: Industry;stagePreference?: Stage;location?: string;createdAt?: string}) {
    return prisma.investorProfile.findMany({
      where: {
        ...(filters.industry && {
          industries: { has: filters.industry }
        }),
        ...(filters.stagePreference && {
          stagePreference: { has: filters.stagePreference }
        }),
        ...(filters.location && {
          location: { contains: filters.location, mode: 'insensitive' }
        }),
        ...(filters.createdAt && {
          createdAt: { gte: new Date(filters.createdAt) }
        }),
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
