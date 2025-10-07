import { prisma } from '../prisma';
import { CreateStartupDto, UpdateStartupDto } from '../dtos/startup.dto';

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
}
