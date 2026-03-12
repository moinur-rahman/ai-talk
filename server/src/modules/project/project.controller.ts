import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ProjectService } from './project.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { SessionUser } from '../../common/decorators/current-user.decorator.js';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  async createProject(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateProjectDto,
  ) {
    const project = await this.projectService.createProject(user.id, dto);
    return { data: project, message: 'Project created successfully' };
  }

  @Get()
  async getProjects(@CurrentUser() user: SessionUser) {
    const projects = await this.projectService.getProjects(user.id);
    return { data: projects, message: 'Projects fetched successfully' };
  }

  @Get(':projectId')
  async getProject(
    @CurrentUser() user: SessionUser,
    @Param('projectId') projectId: string,
  ) {
    const project = await this.projectService.getProject(user.id, projectId);
    return { data: project, message: 'Project fetched successfully' };
  }

  @Patch(':projectId')
  async updateProject(
    @CurrentUser() user: SessionUser,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const project = await this.projectService.updateProject(
      user.id,
      projectId,
      dto,
    );
    return { data: project, message: 'Project updated successfully' };
  }

  @Delete(':projectId')
  async deleteProject(
    @CurrentUser() user: SessionUser,
    @Param('projectId') projectId: string,
  ) {
    await this.projectService.deleteProject(user.id, projectId);
    return { message: 'Project deleted successfully' };
  }
}
