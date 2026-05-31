import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import { RecordUsageDto } from './dto/record-usage.dto.js';
import { UpdatePricingDto } from './dto/update-pricing.dto.js';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordMessageUsage(dto: RecordUsageDto): Promise<void> {
    try {
      const pricing = await this.prisma.modelPricing.findUnique({
        where: { modelId: dto.modelId },
      });

      if (!pricing) {
        this.logger.warn(
          `No pricing found for model ${dto.modelId}, skipping usage record`,
        );
        return;
      }

      const { usage } = dto;
      const inputPrice = Number(pricing.inputTokenPrice);
      const outputPrice = Number(pricing.outputTokenPrice);
      const reasoningPrice =
        pricing.reasoningTokenPrice != null
          ? Number(pricing.reasoningTokenPrice)
          : null;

      const inputCost = (usage.inputTokens / 1_000_000) * inputPrice;
      const outputCost = (usage.outputTokens / 1_000_000) * outputPrice;
      const reasoningCost =
        usage.reasoningTokens != null && reasoningPrice != null
          ? (usage.reasoningTokens / 1_000_000) * reasoningPrice
          : null;
      const totalCost = inputCost + outputCost + (reasoningCost ?? 0);

      await this.prisma.messageUsage.create({
        data: {
          messageId: dto.messageId,
          modelPricingId: pricing.id,
          providerName: dto.providerName,
          modelName: dto.modelName,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          reasoningTokens: usage.reasoningTokens ?? null,
          totalTokens: usage.totalTokens,
          inputCost,
          outputCost,
          reasoningCost,
          totalCost,
          tokenSource: usage.tokenSource === 'api' ? 'api' : 'estimated',
        },
      });
    } catch (error) {
      this.logger.warn('Failed to record message usage', error);
    }
  }

  async getDashboardSummary(userId: string, from: Date, to: Date) {
    const result = await this.prisma.messageUsage.aggregate({
      where: {
        message: { conversation: { userId } },
        createdAt: { gte: from, lte: to },
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        reasoningTokens: true,
        totalTokens: true,
        totalCost: true,
      },
      _count: { id: true },
    });

    return {
      messageCount: result._count.id,
      inputTokens: result._sum.inputTokens ?? 0,
      outputTokens: result._sum.outputTokens ?? 0,
      reasoningTokens: result._sum.reasoningTokens ?? 0,
      totalTokens: result._sum.totalTokens ?? 0,
      totalCost: Number(result._sum.totalCost ?? 0),
    };
  }

  async getUsageByModel(userId: string, from: Date, to: Date) {
    const rows = await this.prisma.messageUsage.groupBy({
      by: ['modelName', 'providerName'],
      where: {
        message: { conversation: { userId } },
        createdAt: { gte: from, lte: to },
      },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        totalCost: true,
      },
      _count: { id: true },
    });

    const grandTotal = rows.reduce(
      (sum, r) => sum + Number(r._sum.totalCost ?? 0),
      0,
    );

    return rows.map((r) => ({
      modelName: r.modelName,
      providerName: r.providerName,
      messageCount: r._count.id,
      inputTokens: r._sum.inputTokens ?? 0,
      outputTokens: r._sum.outputTokens ?? 0,
      totalTokens: r._sum.totalTokens ?? 0,
      totalCost: Number(r._sum.totalCost ?? 0),
      percentOfTotalCost:
        grandTotal > 0
          ? Math.round((Number(r._sum.totalCost ?? 0) / grandTotal) * 10000) /
            100
          : 0,
    }));
  }

  async getDailyUsage(userId: string, from: Date, to: Date) {
    const rows = await this.prisma.$queryRaw<
      {
        date: Date;
        message_count: bigint;
        input_tokens: bigint;
        output_tokens: bigint;
        total_tokens: bigint;
        total_cost: string;
      }[]
    >`
      SELECT
        DATE(mu.created_at) AS date,
        COUNT(mu.id)::bigint AS message_count,
        COALESCE(SUM(mu.input_tokens), 0)::bigint AS input_tokens,
        COALESCE(SUM(mu.output_tokens), 0)::bigint AS output_tokens,
        COALESCE(SUM(mu.total_tokens), 0)::bigint AS total_tokens,
        COALESCE(SUM(mu.total_cost), 0)::text AS total_cost
      FROM message_usage mu
      JOIN messages m ON m.id = mu.message_id
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.user_id = ${userId}::uuid
        AND mu.created_at >= ${from}
        AND mu.created_at <= ${to}
      GROUP BY DATE(mu.created_at)
      ORDER BY DATE(mu.created_at) ASC
    `;

    return rows.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      messageCount: Number(r.message_count),
      inputTokens: Number(r.input_tokens),
      outputTokens: Number(r.output_tokens),
      totalTokens: Number(r.total_tokens),
      totalCost: Number(r.total_cost),
    }));
  }

  async getModelPricing(modelId: string) {
    const pricing = await this.prisma.modelPricing.findUnique({
      where: { modelId },
      include: { model: { include: { provider: true } } },
    });

    if (!pricing) {
      throw new NotFoundException(`Pricing not found for model ${modelId}`);
    }

    return {
      id: pricing.id,
      modelId: pricing.modelId,
      modelName: pricing.model.name,
      providerName: pricing.model.provider.name,
      inputTokenPrice: Number(pricing.inputTokenPrice),
      outputTokenPrice: Number(pricing.outputTokenPrice),
      reasoningTokenPrice:
        pricing.reasoningTokenPrice != null
          ? Number(pricing.reasoningTokenPrice)
          : null,
      updatedAt: pricing.updatedAt,
    };
  }

  async getAllModelPricing() {
    const rows = await this.prisma.modelPricing.findMany({
      include: { model: { include: { provider: true } } },
      orderBy: [
        { model: { provider: { name: 'asc' } } },
        { model: { name: 'asc' } },
      ],
    });

    return rows.map((p) => ({
      id: p.id,
      modelId: p.modelId,
      modelName: p.model.name,
      providerName: p.model.provider.name,
      inputTokenPrice: Number(p.inputTokenPrice),
      outputTokenPrice: Number(p.outputTokenPrice),
      reasoningTokenPrice:
        p.reasoningTokenPrice != null ? Number(p.reasoningTokenPrice) : null,
      updatedAt: p.updatedAt,
    }));
  }

  upsertModelPricing(modelId: string, dto: UpdatePricingDto) {
    return this.prisma.modelPricing.upsert({
      where: { modelId },
      create: {
        modelId,
        inputTokenPrice: dto.inputTokenPrice,
        outputTokenPrice: dto.outputTokenPrice,
        reasoningTokenPrice: dto.reasoningTokenPrice ?? null,
      },
      update: {
        inputTokenPrice: dto.inputTokenPrice,
        outputTokenPrice: dto.outputTokenPrice,
        reasoningTokenPrice: dto.reasoningTokenPrice ?? null,
      },
    });
  }

  parseDateRange(from?: string, to?: string): { from: Date; to: Date } {
    const now = new Date();
    const toDate = to ? new Date(to) : now;
    const fromDate = from
      ? new Date(from)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    toDate.setHours(23, 59, 59, 999);
    return { from: fromDate, to: toDate };
  }
}
