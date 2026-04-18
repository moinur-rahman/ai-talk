import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers/prisma/prisma.service.js';
import { FileService } from '../../file/file.service.js';
import { FileMetadataResponseDto } from '../../file/dto/file-metadata-response.dto.js';
import { SaveMessageDto, SenderType } from './dto/save-message.dto.js';
import { ConversationService } from '../conversation/conversation.service.js';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly conversationService: ConversationService,
  ) {}

  async saveMessage(dto: SaveMessageDto) {
    return await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          mainContent: dto.mainContent,
          reasoningContent: dto.reasoningContent,
          openaiImageCallId: dto.openaiImageCallId,
          senderType: dto.senderType,
          inputType: dto.inputType,
          audioDurationMs: dto.audioDurationMs,
          parentMessageId: dto.parentMessageId,
          modelId:
            dto.senderType === SenderType.assistant ? dto.modelId : undefined,
          conversationId: dto.conversationId,
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

      return message;
    });
  }

  async getMessagesByConversationId({
    conversationId,
    leafMessageId,
  }: {
    conversationId: string;
    leafMessageId?: string;
  }) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      select: {
        id: true,
        mainContent: true,
        reasoningContent: true,
        openaiImageCallId: true,
        senderType: true,
        inputType: true,
        audioDurationMs: true,
        parentMessageId: true,
        modelId: true,
        attachments: {
          select: { fileId: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const filteredMessages: typeof messages = [];

    let currentMessageId: string | null = leafMessageId ?? null;

    if (!currentMessageId) {
      currentMessageId =
        await this.conversationService.getActiveLeafMessage(conversationId);
    }

    while (currentMessageId) {
      const message = messages.find((m) => m.id === currentMessageId);

      if (message) {
        filteredMessages.push(message);
        currentMessageId = message.parentMessageId;
      }
    }

    filteredMessages.reverse();

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        title: true,
        project: { select: { id: true, name: true } },
      },
    });

    const fileIds = filteredMessages.flatMap((msg) =>
      msg.attachments.map((a) => a.fileId),
    );

    const filesMetadata =
      fileIds.length > 0
        ? await this.fileService.getMultipleFilesMetadata(fileIds)
        : [];

    const filesMetadataMap: Record<string, FileMetadataResponseDto> =
      Object.fromEntries(filesMetadata.map((f) => [f.id, f]));

    const messagesWithFiles = filteredMessages.map((msg) => ({
      id: msg.id,
      mainContent: msg.mainContent,
      reasoningContent: msg.reasoningContent,
      openaiImageCallId: msg.openaiImageCallId,
      senderType: msg.senderType,
      inputType: msg.inputType,
      audioDurationMs: msg.audioDurationMs,
      modelId: msg.modelId,
      parentMessageId: msg.parentMessageId,
      attachments: msg.attachments
        .map((a) => filesMetadataMap[a.fileId])
        .filter((f): f is FileMetadataResponseDto => f !== undefined),
    }));

    return {
      messages: messagesWithFiles,
      title: conversation?.title ?? null,
      project: conversation?.project ?? null,
    };
  }
}
