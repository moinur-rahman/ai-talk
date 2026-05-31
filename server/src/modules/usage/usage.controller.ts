import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsageService } from './usage.service.js';
import { UsageQueryDto } from './dto/usage-query.dto.js';
import { UpdatePricingDto } from './dto/update-pricing.dto.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { SessionUser } from '../../common/decorators/current-user.decorator.js';

@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('dashboard')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDashboardSummary(
    @CurrentUser() user: SessionUser,
    @Query() query: UsageQueryDto,
  ) {
    const { from, to } = this.usageService.parseDateRange(query.from, query.to);
    const data = await this.usageService.getDashboardSummary(user.id, from, to);
    return { data, message: 'Dashboard summary fetched successfully' };
  }

  @Get('by-model')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getUsageByModel(
    @CurrentUser() user: SessionUser,
    @Query() query: UsageQueryDto,
  ) {
    const { from, to } = this.usageService.parseDateRange(query.from, query.to);
    const data = await this.usageService.getUsageByModel(user.id, from, to);
    return { data, message: 'Usage by model fetched successfully' };
  }

  @Get('daily')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDailyUsage(
    @CurrentUser() user: SessionUser,
    @Query() query: UsageQueryDto,
  ) {
    const { from, to } = this.usageService.parseDateRange(query.from, query.to);
    const data = await this.usageService.getDailyUsage(user.id, from, to);
    return { data, message: 'Daily usage fetched successfully' };
  }

  @UseGuards(AdminGuard)
  @Get('pricing')
  async getAllModelPricing() {
    const data = await this.usageService.getAllModelPricing();
    return { data, message: 'Model pricing fetched successfully' };
  }

  @UseGuards(AdminGuard)
  @Get('pricing/:modelId')
  async getModelPricing(@Param('modelId') modelId: string) {
    const data = await this.usageService.getModelPricing(modelId);
    return { data, message: 'Model pricing fetched successfully' };
  }

  @UseGuards(AdminGuard)
  @Patch('pricing/:modelId')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async upsertModelPricing(
    @Param('modelId') modelId: string,
    @Body() dto: UpdatePricingDto,
  ) {
    const data = await this.usageService.upsertModelPricing(modelId, dto);
    return { data, message: 'Model pricing updated successfully' };
  }
}
