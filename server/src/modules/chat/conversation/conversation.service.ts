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

  async getConversations(userId: string, limit: number, cursor?: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        userId,
        ...(cursor ? { updatedAt: { lt: new Date(cursor) } } : {}),
      },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
    });

    const hasNextPage = conversations.length > limit;
    const items = hasNextPage ? conversations.slice(0, limit) : conversations;
    const nextCursor = hasNextPage
      ? items[items.length - 1].updatedAt.toISOString()
      : null;

    return {
      conversations: items.map(({ id, title }) => ({ id, title })),
      hasNextPage,
      nextCursor,
    };
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
