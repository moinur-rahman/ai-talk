import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { GetProjectsQueryDto } from './dto/get-projects-query.dto.js';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { userId, ...dto },
      select: {
        id: true,
        name: true,
        description: true,
        instructions: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getProjects(userId: string, query: GetProjectsQueryDto = {}) {
    const { search, sort } = query;
    return this.prisma.project.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        instructions: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { conversations: true } },
      },
      orderBy:
        sort === 'created' ? { createdAt: 'desc' } : { updatedAt: 'desc' },
    });
  }

  async getProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      select: {
        id: true,
        name: true,
        description: true,
        instructions: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    await this.getProject(userId, projectId);
    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
      select: {
        id: true,
        name: true,
        description: true,
        instructions: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteProject(userId: string, projectId: string) {
    await this.getProject(userId, projectId);
    await this.prisma.project.delete({ where: { id: projectId } });
  }

  async getProjectInstructions(projectId: string): Promise<string | null> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { instructions: true },
    });
    return project?.instructions ?? null;
  }
}
