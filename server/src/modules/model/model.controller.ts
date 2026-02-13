import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ModelService } from './model.service.js';
import { UpdateDefaultModelDto } from './dto/update-default-model.dto.js';
import { ProviderParamsDto } from './dto/provider-params.dto.js';

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

  @Post('default-model')
  async updateDefaultModel(@Req() req, @Body() body: UpdateDefaultModelDto) {
    const result = await this.modelService.updateDefaultModel(
      req.user.id,
      body.modelId,
      body.providerId,
    );
    return {
      data: result,
      message: 'Default model updated successfully',
    };
  }

  @Get('default-model')
  async getDefaultModel(@Req() req) {
    const result = await this.modelService.getDefaultModel(req.user.id);
    return {
      data: result,
      message: 'Default model fetched successfully',
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
}
