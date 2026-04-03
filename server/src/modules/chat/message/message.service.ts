import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../providers/prisma/prisma.service.js';
import { FileService } from '../../file/file.service.js';
import { FileMetadataResponseDto } from '../../file/dto/file-metadata-response.dto.js';
import { SaveMessageDto, SenderType } from './dto/save-message.dto.js';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async saveMessage(dto: SaveMessageDto) {
    await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          mainContent: dto.mainContent,
          reasoningContent: dto.reasoningContent,
          openaiImageCallId: dto.openaiImageCallId,
          senderType: dto.senderType,
          inputType: dto.inputType,
          audioDurationMs: dto.audioDurationMs,
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
    });
  }

  async getMessagesByConversationId(conversationId: string) {
    type MessageRow = {
      id: string;
      mainContent: string | null;
      reasoningContent: string | null;
      openaiImageCallId: string | null;
      senderType: string;
      inputType: string;
      audioDurationMs: number | null;
      modelId: string | null;
      attachments: Array<{ fileId: string }>;
    };

    const messages = (await this.prisma.message.findMany({
      where: { conversationId },
      select: {
        id: true,
        mainContent: true,
        reasoningContent: true,
        openaiImageCallId: true,
        senderType: true,
        inputType: true,
        audioDurationMs: true,
        modelId: true,
        attachments: {
          select: { fileId: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })) as MessageRow[];

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        title: true,
        project: { select: { id: true, name: true } },
      },
    });

    const fileIds = messages.flatMap((msg) =>
      msg.attachments.map((a) => a.fileId),
    );

    const filesMetadata =
      fileIds.length > 0
        ? await this.fileService.getMultipleFilesMetadata(fileIds)
        : [];

    const filesMetadataMap: Record<string, FileMetadataResponseDto> =
      Object.fromEntries(filesMetadata.map((f) => [f.id, f]));

    const messagesWithFiles = messages.map((msg) => ({
      mainContent: msg.mainContent,
      reasoningContent: msg.reasoningContent,
      openaiImageCallId: msg.openaiImageCallId,
      senderType: msg.senderType,
      inputType: msg.inputType,
      audioDurationMs: msg.audioDurationMs,
      modelId: msg.modelId,
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
