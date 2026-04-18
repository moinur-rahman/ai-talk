import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers/prisma/prisma.service.js';

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(userId: string, projectId?: string) {
    const result = await this.prisma.conversation.create({
      data: { userId, ...(projectId ? { projectId } : {}) },
    });
    return result.id;
  }

  async getConversations(
    userId: string,
    limit: number,
    cursor?: string,
    projectId?: string,
  ) {
    const baseWhere = {
      userId,
      ...(projectId !== undefined ? { projectId } : {}),
    };

    const findPromise = this.prisma.conversation.findMany({
      where: {
        ...baseWhere,
        ...(cursor ? { updatedAt: { lt: new Date(cursor) } } : {}),
      },
      select: { id: true, title: true, updatedAt: true, projectId: true },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
    });

    const countPromise =
      projectId !== undefined
        ? this.prisma.conversation.count({ where: baseWhere })
        : Promise.resolve(null);

    const [conversations, total] = await Promise.all([
      findPromise,
      countPromise,
    ]);

    const hasNextPage = conversations.length > limit;
    const items = hasNextPage ? conversations.slice(0, limit) : conversations;
    const nextCursor = hasNextPage
      ? items[items.length - 1].updatedAt.toISOString()
      : null;

    return {
      conversations: items.map(({ id, title, updatedAt, projectId }) => ({
        id,
        title,
        updatedAt,
        projectId,
      })),
      hasNextPage,
      nextCursor,
      ...(total !== null ? { total } : {}),
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

  async deleteConversation(userId: string, conversationId: string) {
    await this.prisma.conversation.deleteMany({
      where: { id: conversationId, userId },
    });
  }

  async deleteAllConversations(userId: string) {
    await this.prisma.conversation.deleteMany({ where: { userId } });
  }

  async updateProject(
    conversationId: string,
    userId: string,
    projectId: string | null,
  ) {
    await this.prisma.conversation.updateMany({
      where: { id: conversationId, userId },
      data: { projectId },
    });
  }

  async updateTitle(conversationId: string, title: string) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  async getProjectId(conversationId: string): Promise<string | null> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { projectId: true },
    });
    return conv?.projectId ?? null;
  }

  async updateActiveLeafMessage(conversationId: string, leafMessageId: string) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { activeLeafMessageId: leafMessageId },
    });
  }

  async getActiveLeafMessage(conversationId: string): Promise<string | null> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { activeLeafMessageId: true },
    });
    return conversation?.activeLeafMessageId ?? null;
  }
}
