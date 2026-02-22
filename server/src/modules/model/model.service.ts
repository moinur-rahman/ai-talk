import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import { OllamaService } from '../llm/ollama/ollama.service.js';
import { OpenAIService } from '../llm/openai/openai.service.js';
import { OpenRouterService } from '../llm/openrouter/openrouter.service.js';
import { SYSTEM_PROVIDERS } from '../../common/constants/providers.js';

type SyncModelData = {
  name: string;
  description: string;
  hasReasoning: boolean;
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

  async getProviders() {
    return await this.prisma.provider.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getModelList(providerId: string) {
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return await this.prisma.model.findMany({
      select: {
        id: true,
        name: true,
        hasReasoning: true,
      },
      where: {
        providerId,
        isDeprecated: false,
      },
    });
  }

  async getModelDetails(modelId: string) {
    const model = await this.prisma.model.findUnique({
      where: {
        id: modelId,
      },
      select: {
        name: true,
        hasReasoning: true,
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
    const name = providerName.toLowerCase();
    if (name === 'ollama') return this.ollamaService.listModels();
    if (name === 'openai') return this.openaiService.listModels();
    if (name === 'openrouter') return this.openRouterService.listModels();
    return [];
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
              hasReasoning: model.hasReasoning,
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
