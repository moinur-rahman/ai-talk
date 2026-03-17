import { Injectable, Logger } from '@nestjs/common';
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
    conversationId: string,
    userId: string,
    dto: StreamChatDto,
    sendEvent: SendEvent,
    onProviderResolved: (providerName: string) => void,
  ): Promise<void> {
    const modelDetails = await this.modelService.getModelDetails(
      dto.lastModelId,
    );
    const providerName = modelDetails.provider.name.toLowerCase();
    const enableReasoning = Boolean(
      dto.enableReasoning && modelDetails.hasReasoning,
    );

    onProviderResolved(providerName);

    const [projectId, userPrefs] = await Promise.all([
      this.conversationService.getProjectId(conversationId),
      this.userService.getUserPreferences(userId),
    ]);

    const projectInstructions =
      projectId != null
        ? await this.projectService.getProjectInstructions(String(projectId))
        : null;

    const systemPrompt = this.buildSystemPrompt(userPrefs, projectInstructions);

    const { messages: chatHistory } =
      await this.messageService.getMessagesByConversationId(conversationId);

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
      conversationId,
      lastProviderId: modelDetails.provider.id,
      lastModelId: dto.lastModelId,
      fileIds: dto.fileIds,
    });

    const titlePromise =
      chatHistory.length === 0
        ? this.generateAndSendTitle(
            conversationId,
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

    const streamPromise = this.llmService.streamResponse(
      providerName,
      {
        model: modelDetails.name,
        conversationId,
        messages,
        enableReasoning,
        systemPrompt,
      },
      async (token: string, tokenType: TokenType, isEnd: boolean) => {
        if (tokenType === 'mainContent') {
          mainContentBuffer += token;
        } else if (tokenType === 'reasoningContent') {
          reasoningContentBuffer += token;
        }

        sendEvent({ type: 'token', token, tokenType, isEnd, conversationId });

        if (tokenType === 'mainContent' && isEnd) {
          if (mainContentBuffer || reasoningContentBuffer) {
            await this.messageService.saveMessage({
              mainContent: mainContentBuffer,
              reasoningContent: reasoningContentBuffer || undefined,
              senderType: SenderType.assistant,
              conversationId,
            });
          }
        }
      },
    );

    await Promise.all([streamPromise, titlePromise]);
  }

  private buildSystemPrompt(
    userPrefs: {
      displayName: string | null;
      workDescription: string | null;
      customInstructions: string | null;
    },
    projectInstructions: string | null,
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
