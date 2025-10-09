import { prisma } from '../prisma';
import { CreateProjectDto, UpdateProjectDto } from '../dtos/project.dto';

export class ProjectService {
  async getAll() {
    return prisma.project.findMany({ include: { startup: true, matches: true } });
  }

  async getById(id: string) {
    return prisma.project.findUnique({ where: { id }, include: { startup: true, matches: true } });
  }

  async findStartupByUserId(userId: string) {
    return prisma.startupProfile.findUnique({ where: { userId } });
  }

  async create(startupId: string, data: CreateProjectDto) {
    return prisma.project.create({
      data: { ...data, startupId }
    });
  }

  async update(id: string, data: UpdateProjectDto) {
    return prisma.project.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.project.delete({ where: { id } });
  }
}
