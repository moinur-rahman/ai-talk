import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers/prisma/prisma.service.js';

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(userId: string) {
    const result = await this.prisma.conversation.create({
      data: { userId },
    });
    return result.id;
  }

  async getConversations(userId: string) {
    return await this.prisma.conversation.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateTitle(conversationId: string, title: string) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  async getLastModelAndProvider(conversationId: string) {
    return await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        lastProviderId: true,
        lastModelId: true,
      },
    });
  }

  async updateModelProvider(
    conversationId: string,
    lastProviderId: string,
    lastModelId: string,
    tx?: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ) {
    const client = tx || this.prisma;
    await client.conversation.update({
      where: { id: conversationId },
      data: { lastProviderId, lastModelId },
    });
  }
}
