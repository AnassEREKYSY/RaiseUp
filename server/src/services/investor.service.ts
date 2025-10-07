import { prisma } from '../prisma';
import { CreateInvestorDto, UpdateInvestorDto } from '../dtos/investor.dto';

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
    return prisma.investorProfile.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.investorProfile.delete({ where: { id } });
  }
}
