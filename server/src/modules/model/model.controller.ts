import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ModelService } from './model.service.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { CreateModelDto } from './dto/create-model.dto.js';
import { UpdateModelDto } from './dto/update-model.dto.js';

@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get('list')
  async getAllModels() {
    const models = await this.modelService.getAllModels();
    return {
      data: models,
      message: 'Models fetched successfully',
    };
  }

  @Get(':modelId')
  async getModelDetails(@Param('modelId') modelId: string) {
    const result = await this.modelService.getModelDetails(modelId);
    return {
      data: result,
      message: 'Model details fetched successfully',
    };
  }

  @UseGuards(AdminGuard)
  @Get('admin/overview')
  async getAdminOverview() {
    const result = await this.modelService.getAdminOverview();
    return {
      data: result,
      message: 'Admin overview fetched successfully',
    };
  }

  @UseGuards(AdminGuard)
  @Post('admin/create')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createModel(@Body() dto: CreateModelDto) {
    const result = await this.modelService.createModel(dto);
    return {
      data: result,
      message: 'Model created successfully',
    };
  }

  @UseGuards(AdminGuard)
  @Patch('admin/:modelId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateModel(
    @Param('modelId') modelId: string,
    @Body() dto: UpdateModelDto,
  ) {
    const result = await this.modelService.updateModel(modelId, dto);
    return {
      data: result,
      message: 'Model updated successfully',
    };
  }

  @UseGuards(AdminGuard)
  @Post('admin/sync')
  async syncModels() {
    const result = await this.modelService.syncModels();
    return {
      data: result,
      message: 'Models synced successfully',
    };
  }
}
