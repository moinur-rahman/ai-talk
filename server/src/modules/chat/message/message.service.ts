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
    anchorMessageId,
    followToLeaf = true,
  }: {
    conversationId: string;
    anchorMessageId: string | null;
    followToLeaf?: boolean;
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

    //* Helper function to check if a message is a descendant of another message or itself.
    //* This function traverses the message tree upwards from the given message ID
    //* until it finds the ancestor ID or reaches the root (null parent).
    //* Returns true if the message is a descendant of the ancestor, false otherwise.
    const isDescendantOrSelf = (id: string) => {
      if (!anchorMessageId) {
        return false;
      }
      let currentId: string | null = id;
      while (currentId) {
        if (currentId === anchorMessageId) {
          return true;
        }
        const message = messages.find((m) => m.id === currentId);
        currentId = message?.parentMessageId ?? null;
      }
      return false;
    };

    //* A leaf message is a message that has no children.
    //* This helper function checks if a message is a leaf by verifying that
    //* no other message has the current message as its parent.
    const isLeaf = (message: (typeof messages)[number]) => {
      return !messages.some((other) => other.parentMessageId === message.id);
    };

    const leaves = anchorMessageId
      ? messages.filter((m) => isLeaf(m) && isDescendantOrSelf(m.id))
      : [];

    const filteredMessages: typeof messages = [];

    const leafMessageId: string | null = followToLeaf
      ? (leaves.at(-1)?.id ?? anchorMessageId)
      : anchorMessageId;

    let currentMessageId: string | null = leafMessageId;

    while (currentMessageId) {
      const message = messages.find((m) => m.id === currentMessageId);

      if (message) {
        filteredMessages.push(message);
        currentMessageId = message.parentMessageId;
      } else {
        break;
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

    const siblingsByParentId = new Map<string | null, string[]>();
    for (const msg of messages) {
      const key = msg.parentMessageId ?? null;
      const group = siblingsByParentId.get(key) ?? [];
      group.push(msg.id);
      siblingsByParentId.set(key, group);
    }

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
      siblingIds: siblingsByParentId.get(msg.parentMessageId ?? null) ?? [],
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
