import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ModelService } from './model.service.js';
import { ProviderParamsDto } from './dto/provider-params.dto.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';

@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get('providers')
  async getProviders() {
    const providers = await this.modelService.getProviders();
    return {
      data: providers,
      message: 'Providers fetched successfully',
    };
  }

  @Get('list/:providerId')
  async getModelList(@Param() params: ProviderParamsDto) {
    const models = await this.modelService.getModelList(params.providerId);
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
  @Post('sync')
  async syncModels() {
    const result = await this.modelService.syncModels();
    return {
      data: result,
      message: 'Models synced successfully',
    };
  }
}
