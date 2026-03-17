import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers/prisma/prisma.service.js';
import { FileService } from '../../file/file.service.js';
import { ConversationService } from '../conversation/conversation.service.js';
import { SaveMessageDto } from './dto/save-message.dto.js';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
    private readonly fileService: FileService,
  ) {}

  async saveMessage(dto: SaveMessageDto) {
    await this.prisma.$transaction(async (tx) => {
      if (dto.lastModelId && dto.lastProviderId) {
        await this.conversationService.updateModelProvider(
          dto.conversationId,
          dto.lastProviderId,
          dto.lastModelId,
          tx,
        );
      }

      const message = await tx.message.create({
        data: {
          mainContent: dto.mainContent,
          reasoningContent: dto.reasoningContent,
          senderType: dto.senderType,
          conversation: { connect: { id: dto.conversationId } },
        },
      });

      if (dto.fileIds && dto.fileIds.length > 0) {
        await tx.messageAttachment.createMany({
          data: dto.fileIds.map((fileId) => ({
            messageId: message.id,
            fileId,
          })),
        });
      }
    });
  }

  async getMessagesByConversationId(conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      select: {
        id: true,
        mainContent: true,
        reasoningContent: true,
        senderType: true,
        attachments: {
          select: { fileId: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        title: true,
        lastProviderId: true,
        lastModelId: true,
        project: { select: { id: true, name: true } },
      },
    });
    const lastModelAndProvider = conversation
      ? {
          lastProviderId: conversation.lastProviderId,
          lastModelId: conversation.lastModelId,
        }
      : null;

    const fileIds = messages.flatMap((msg) =>
      msg.attachments.map((a) => a.fileId),
    );

    const filesMetadata =
      fileIds.length > 0
        ? await this.fileService.getMultipleFilesMetadata(fileIds)
        : [];

    const filesMetadataMap = Object.fromEntries(
      filesMetadata.map((f) => [f.id, f]),
    );

    const messagesWithFiles = messages.map((msg) => ({
      mainContent: msg.mainContent,
      reasoningContent: msg.reasoningContent,
      senderType: msg.senderType,
      attachments: msg.attachments
        .map((a) => filesMetadataMap[a.fileId])
        .filter(Boolean),
    }));

    return {
      messages: messagesWithFiles,
      lastModelAndProvider,
      title: conversation?.title ?? null,
      project: conversation?.project ?? null,
    };
  }
}
