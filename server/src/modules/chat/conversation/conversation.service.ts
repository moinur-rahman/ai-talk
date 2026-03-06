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

  async searchConversations(userId: string, query: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          {
            messages: {
              some: { mainContent: { contains: query, mode: 'insensitive' } },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        messages: {
          where: { mainContent: { contains: query, mode: 'insensitive' } },
          select: { mainContent: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    return conversations.map((c) => ({
      id: c.id,
      title: c.title,
      snippet: c.messages[0]?.mainContent
        ? this.extractSnippet(c.messages[0].mainContent, query)
        : null,
    }));
  }

  private extractSnippet(content: string, query: string): string {
    const WINDOW = 120;
    const matchIndex = content.toLowerCase().indexOf(query.toLowerCase());

    if (matchIndex === -1) {
      return content.length > WINDOW
        ? content.slice(0, WINDOW) + '...'
        : content;
    }

    const start = Math.max(0, matchIndex - Math.floor(WINDOW / 2));
    const end = Math.min(content.length, start + WINDOW);

    return (
      (start > 0 ? '...' : '') +
      content.slice(start, end) +
      (end < content.length ? '...' : '')
    );
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
