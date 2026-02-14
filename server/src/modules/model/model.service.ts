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
