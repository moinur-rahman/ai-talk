import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { CreateModelDto } from './dto/create-model.dto.js';
import { UpdateModelDto } from './dto/update-model.dto.js';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import { OllamaService } from '../llm/ollama/ollama.service.js';
import { OpenAIService } from '../llm/openai/openai.service.js';
import { OpenRouterService } from '../llm/openrouter/openrouter.service.js';
import { ZaiService } from '../llm/zai/zai.service.js';
import { GeminiService } from '../llm/gemini/gemini.service.js';
import {
  PROVIDER,
  SYSTEM_PROVIDERS,
} from '../../common/constants/providers.js';

type SyncModelData = {
  name: string;
  description: string;
};

type ProviderSyncResult =
  | { provider: string; created: number; updated: number; deprecated: number }
  | { provider: string; error: string };

@Injectable()
export class ModelService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ModelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ollamaService: OllamaService,
    private readonly openaiService: OpenAIService,
    private readonly openRouterService: OpenRouterService,
    private readonly zaiService: ZaiService,
    private readonly geminiService: GeminiService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedProviders();
  }

  private async seedProviders(): Promise<void> {
    for (const name of SYSTEM_PROVIDERS) {
      await this.prisma.provider.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
    this.logger.log('Providers seeded successfully');
  }

  async getAllModels() {
    return await this.prisma.model.findMany({
      select: {
        id: true,
        name: true,
        provider: {
          select: { id: true, name: true },
        },
      },
      where: {
        isDeprecated: false,
        isEnabled: true,
      },
      orderBy: [{ provider: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async getModelDetails(modelId: string) {
    const model = await this.prisma.model.findUnique({
      where: {
        id: modelId,
      },
      select: {
        name: true,
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    return model;
  }

  async getAdminOverview() {
    return await this.prisma.provider.findMany({
      select: {
        id: true,
        name: true,
        models: {
          select: {
            id: true,
            name: true,
            description: true,
            isDeprecated: true,
            isEnabled: true,
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createModel(dto: CreateModelDto) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: dto.providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const existing = await this.prisma.model.findFirst({
      where: { name: dto.name, providerId: dto.providerId },
    });

    if (existing) {
      throw new ConflictException(
        'Model with this name already exists for this provider',
      );
    }

    return await this.prisma.model.create({
      data: {
        name: dto.name,
        description: dto.description ?? '',
        isDeprecated: false,
        isEnabled: dto.isEnabled ?? false,
        providerId: dto.providerId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isDeprecated: true,
        isEnabled: true,
      },
    });
  }

  async updateModel(modelId: string, dto: UpdateModelDto) {
    const model = await this.prisma.model.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    return await this.prisma.model.update({
      where: { id: modelId },
      data: dto,
      select: {
        id: true,
        name: true,
        description: true,
        isDeprecated: true,
        isEnabled: true,
      },
    });
  }

  async syncModels(): Promise<{ results: ProviderSyncResult[] }> {
    const providers = await this.prisma.provider.findMany();
    const results: ProviderSyncResult[] = [];

    for (const provider of providers) {
      try {
        const fetchedModels = await this.fetchModelsForProvider(provider.name);
        const counts = await this.synchronizeProviderModels(
          provider.id,
          fetchedModels,
        );
        results.push({ provider: provider.name, ...counts });
      } catch (error) {
        this.logger.error(
          `Failed to sync models for provider "${provider.name}"`,
          error,
        );
        results.push({
          provider: provider.name,
          error: 'Failed to sync models',
        });
      }
    }

    return { results };
  }

  private async fetchModelsForProvider(
    providerName: string,
  ): Promise<SyncModelData[]> {
    switch (providerName.toLowerCase()) {
      case PROVIDER.OLLAMA:
        return this.ollamaService.listModels();
      case PROVIDER.OPENAI:
        return this.openaiService.listModels();
      case PROVIDER.OPENROUTER:
        return this.openRouterService.listModels();
      case PROVIDER.ZAI:
        return this.zaiService.listModels();
      case PROVIDER.GEMINI:
        return this.geminiService.listModels();
      default:
        return [];
    }
  }

  private async synchronizeProviderModels(
    providerId: string,
    fetchedModels: SyncModelData[],
  ): Promise<{ created: number; updated: number; deprecated: number }> {
    return await this.prisma.$transaction(async (tx) => {
      const existingModels = await tx.model.findMany({ where: { providerId } });
      const existingByName = new Map(existingModels.map((m) => [m.name, m]));
      const fetchedNames = new Set(fetchedModels.map((m) => m.name));

      let created = 0;
      let updated = 0;
      let deprecated = 0;

      for (const model of fetchedModels) {
        const existing = existingByName.get(model.name);
        if (!existing) {
          await tx.model.create({
            data: {
              name: model.name,
              description: model.description,
              isDeprecated: false,
              providerId,
            },
          });
          created++;
        } else if (existing.isDeprecated) {
          await tx.model.update({
            where: { id: existing.id },
            data: { isDeprecated: false },
          });
          updated++;
        }
      }

      for (const existing of existingModels) {
        if (!fetchedNames.has(existing.name) && !existing.isDeprecated) {
          await tx.model.update({
            where: { id: existing.id },
            data: { isDeprecated: true },
          });
          deprecated++;
        }
      }

      return { created, updated, deprecated };
    });
  }
}
