import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service.js';

@Injectable()
export class ModelService {
  constructor(private readonly prisma: PrismaService) {}

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

  async updateDefaultModel(
    userId: string,
    modelId: string,
    providerId: string,
  ) {
    const model = await this.prisma.model.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    await this.prisma.defaultModel.upsert({
      where: {
        userId,
      },
      update: {
        modelId,
        providerId,
      },
      create: {
        userId,
        modelId,
        providerId,
      },
    });

    return { success: true };
  }

  async getDefaultModel(userId: string) {
    const defaultModel = await this.prisma.defaultModel.findUnique({
      where: {
        userId,
      },
      select: {
        modelId: true,
        providerId: true,
      },
    });

    return defaultModel;
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
}
