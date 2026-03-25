import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../llm/llm.service.js';
import { ModelService } from '../../model/model.service.js';
import { MessageService } from '../message/message.service.js';
import { FileService } from '../../file/file.service.js';
import { ConversationService } from '../conversation/conversation.service.js';
import { ProjectService } from '../../project/project.service.js';
import { UserService } from '../../user/user.service.js';
import { LLMMessage, TokenType } from '../../llm/types/llm.types.js';
import { FileMetadataResponseDto } from '../../file/dto/file-metadata-response.dto.js';
import { SenderType } from '../message/dto/save-message.dto.js';
import { StreamChatDto } from './dto/stream-chat.dto.js';

type SendEvent = (data: object) => void;

@Injectable()
export class ChatStreamService {
  private readonly logger = new Logger(ChatStreamService.name);

  constructor(
    private readonly modelService: ModelService,
    private readonly messageService: MessageService,
    private readonly fileService: FileService,
    private readonly conversationService: ConversationService,
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
    private readonly llmService: LlmService,
  ) {}

  stopStream(providerName: string, conversationId: string): void {
    this.llmService.stopStream(providerName, conversationId);
  }

  async stream(
    conversationId: string | undefined,
    projectId: string | undefined,
    userId: string,
    dto: StreamChatDto,
    sendEvent: SendEvent,
    onProviderResolved: (providerName: string) => void,
    onConversationResolved: (conversationId: string) => void,
  ): Promise<void> {
    const modelDetails = await this.modelService.getModelDetails(
      dto.lastModelId,
    );
    const providerName = modelDetails.provider.name.toLowerCase();
    if (dto.enableReasoning && !modelDetails.hasReasoning) {
      throw new BadRequestException('This model does not support reasoning');
    }
    const enableReasoning = Boolean(dto.enableReasoning);
    const webSearchEnabled = Boolean(dto.webSearchEnabled);
    const imageGenerationEnabled = Boolean(dto.imageGenerationEnabled);

    onProviderResolved(providerName);

    let currentConversationId = conversationId;

    if (!currentConversationId) {
      currentConversationId = await this.conversationService.createConversation(
        userId,
        projectId,
      );
      sendEvent({
        type: 'conversation-created',
        conversationId: currentConversationId,
      });
    }

    onConversationResolved(currentConversationId);

    const [resolvedProjectId, userPrefs] = await Promise.all([
      conversationId !== undefined
        ? this.conversationService.getProjectId(currentConversationId)
        : Promise.resolve(projectId ?? null),
      this.userService.getUserPreferences(userId),
    ]);

    const projectInstructions =
      resolvedProjectId != null
        ? await this.projectService.getProjectInstructions(
            String(resolvedProjectId),
          )
        : null;

    const systemPrompt = this.buildSystemPrompt(
      userPrefs,
      projectInstructions,
      dto.responseStyle,
    );

    const { messages: chatHistory } =
      await this.messageService.getMessagesByConversationId(
        currentConversationId,
      );

    let attachments: FileMetadataResponseDto[] = [];
    if (dto.fileIds && dto.fileIds.length > 0) {
      const filesMetadata = await this.fileService.getMultipleFilesMetadata(
        dto.fileIds,
      );
      attachments = filesMetadata.filter((f) => !f.error);
    }

    const messages: LLMMessage[] = [
      ...chatHistory.map((msg) => ({
        content: msg.mainContent || '',
        senderType: msg.senderType as 'user' | 'assistant',
        openaiImageCallId: msg.openaiImageCallId,
        attachments: msg.attachments
          .filter((a) => !a.error && a.fileName && a.mimeType)
          .map((a) => ({
            id: a.id,
            fileName: a.fileName!,
            mimeType: a.mimeType!,
            fileSize: a.fileSize ?? '0',
            presignedUrl: a.presignedUrl,
            storageUrl: a.storageUrl,
          })),
      })),
      {
        content: dto.prompt,
        senderType: 'user',
        attachments: attachments
          .filter((a) => a.fileName && a.mimeType)
          .map((a) => ({
            id: a.id,
            fileName: a.fileName!,
            mimeType: a.mimeType!,
            fileSize: a.fileSize ?? '0',
            presignedUrl: a.presignedUrl,
            storageUrl: a.storageUrl,
          })),
      },
    ];

    await this.messageService.saveMessage({
      mainContent: dto.prompt,
      senderType: SenderType.user,
      conversationId: currentConversationId,
      lastProviderId: modelDetails.provider.id,
      lastModelId: dto.lastModelId,
      fileIds: dto.fileIds,
    });

    const titlePromise =
      chatHistory.length === 0
        ? this.generateAndSendTitle(
            currentConversationId,
            dto.prompt,
            sendEvent,
          ).catch((err: unknown) =>
            this.logger.error(
              `Failed to generate conversation title: ${err instanceof Error ? err.message : String(err)}`,
            ),
          )
        : Promise.resolve();

    let mainContentBuffer = '';
    let reasoningContentBuffer = '';
    let finalImageBase64 = '';

    const streamPromise = this.llmService.streamResponse(
      providerName,
      {
        model: modelDetails.name,
        conversationId: currentConversationId,
        messages,
        enableReasoning,
        webSearchEnabled,
        imageGenerationEnabled,
        systemPrompt,
      },
      (token: string, tokenType: TokenType, isEnd: boolean) => {
        if (tokenType === 'mainContent') {
          if (!isEnd) mainContentBuffer += token;
          sendEvent({
            type: 'token',
            token,
            tokenType,
            isEnd,
            conversationId: currentConversationId,
          });
        } else if (tokenType === 'reasoningContent') {
          if (!isEnd) reasoningContentBuffer += token;
          sendEvent({
            type: 'token',
            token,
            tokenType,
            isEnd,
            conversationId: currentConversationId,
          });
        } else if (tokenType === 'webSearch') {
          sendEvent({
            type: 'web-search-status',
            status: isEnd ? 'done' : 'searching',
            conversationId: currentConversationId,
          });
        } else if (tokenType === 'partialImage') {
          if (isEnd) {
            finalImageBase64 = token;
          } else {
            sendEvent({
              type: 'partial-image',
              imageData: token,
              conversationId: currentConversationId,
            });
          }
        }
      },
    );

    const [streamResult] = await Promise.all([streamPromise, titlePromise]);

    let generatedFileId: string | undefined;
    if (finalImageBase64) {
      try {
        const imageBuffer = Buffer.from(finalImageBase64, 'base64');
        generatedFileId = await this.fileService.uploadBuffer(
          imageBuffer,
          userId,
          `generated-${Date.now()}.png`,
          'image/png',
        );
        const [fileMeta] = await this.fileService.getMultipleFilesMetadata([
          generatedFileId,
        ]);
        if (fileMeta?.presignedUrl) {
          sendEvent({
            type: 'generated-image',
            presignedUrl: fileMeta.presignedUrl,
            conversationId: currentConversationId,
          });
        }
      } catch (err: unknown) {
        this.logger.error(
          `Failed to upload generated image: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (mainContentBuffer || reasoningContentBuffer || generatedFileId) {
      await this.messageService.saveMessage({
        mainContent: mainContentBuffer || undefined,
        reasoningContent: reasoningContentBuffer || undefined,
        senderType: SenderType.assistant,
        conversationId: currentConversationId,
        fileIds: generatedFileId ? [generatedFileId] : undefined,
        openaiImageCallId: streamResult?.openaiImageCallId,
      });
    }
  }

  private buildSystemPrompt(
    userPrefs: {
      displayName: string | null;
      workDescription: string | null;
      customInstructions: string | null;
    },
    projectInstructions: string | null,
    responseStyle?: string,
  ): string | undefined {
    const parts: string[] = [];

    const profileParts: string[] = [];
    if (userPrefs.displayName) {
      profileParts.push(`Name: ${userPrefs.displayName}`);
    }
    if (userPrefs.workDescription) {
      profileParts.push(`Work: ${userPrefs.workDescription}`);
    }
    if (profileParts.length > 0) {
      parts.push(`[User profile]\n${profileParts.join('\n')}`);
    }

    if (userPrefs.customInstructions) {
      parts.push(`[Personal preferences]\n${userPrefs.customInstructions}`);
    }

    if (projectInstructions) {
      parts.push(`[Project instructions]\n${projectInstructions}`);
    }

    const styleInstructions: Record<string, string> = {
      Learning:
        'Explain concepts clearly and build understanding step by step.',
      Concise: 'Be concise. Keep responses brief and to the point.',
      Explanatory:
        'Provide thorough, detailed explanations with examples where helpful.',
      Formal: 'Use a professional, formal tone in your responses.',
    };
    const styleInstruction = responseStyle && styleInstructions[responseStyle];
    if (styleInstruction) {
      parts.push(`[Response style]\n${styleInstruction}`);
    }

    return parts.length > 0 ? parts.join('\n\n') : undefined;
  }

  private async generateAndSendTitle(
    conversationId: string,
    conversationText: string,
    sendEvent: SendEvent,
  ): Promise<void> {
    const title =
      await this.llmService.generateConversationTitle(conversationText);
    await this.conversationService.updateTitle(conversationId, title);
    sendEvent({ type: 'conversation-title', title, conversationId });
  }
}
