import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../llm/llm.service.js';
import { ModelService } from '../../model/model.service.js';
import { MessageService } from '../message/message.service.js';
import { FileService } from '../../file/file.service.js';
import { RagService } from '../../document/rag.service.js';
import { ConversationService } from '../conversation/conversation.service.js';
import { ProjectService } from '../../project/project.service.js';
import { UserService } from '../../user/user.service.js';
import { LLMMessage, TokenType } from '../../llm/types/llm.types.js';
import { FileMetadataResponseDto } from '../../file/dto/file-metadata-response.dto.js';
import { SenderType } from '../message/dto/save-message.dto.js';
import { StreamChatDto } from './dto/stream-chat.dto.js';
import { getProviderReasoningOptions } from '../../llm/reasoning.constants.js';
import { PROVIDER } from '../../../common/constants/providers.js';

const GEMINI_IMAGE_GEN_MODEL = 'gemini-2.5-flash-image';

type SendEvent = (data: object) => void;

@Injectable()
export class ChatStreamService {
  private readonly logger = new Logger(ChatStreamService.name);

  constructor(
    private readonly modelService: ModelService,
    private readonly messageService: MessageService,
    private readonly fileService: FileService,
    private readonly ragService: RagService,
    private readonly conversationService: ConversationService,
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
    private readonly llmService: LlmService,
  ) {}

  stopStream(providerName: string, conversationId: string): void {
    this.llmService.stopStream(providerName, conversationId);
  }

  async stream(
    userId: string,
    dto: StreamChatDto,
    sendEvent: SendEvent,
    onProviderResolved: (providerName: string) => void,
    onConversationResolved: (conversationId: string) => void,
  ): Promise<void> {
    const {
      prompt,
      branchFromMessageId,
      regenerateFromMessageId,
      conversationId,
      projectId,
      lastModelId,
      reasoningLevel: rawReasoningLevel,
      webSearchEnabled: rawWebSearchEnabled,
      imageGenerationEnabled: rawImageGenerationEnabled,
      responseStyle,
      fileIds,
    } = dto;

    const modelDetails = await this.modelService.getModelDetails(lastModelId);
    const providerName = modelDetails.provider.name.toLowerCase();
    const reasoningLevel = rawReasoningLevel ?? null;

    if (reasoningLevel !== null) {
      const allowedLevels = getProviderReasoningOptions(providerName);
      if (!allowedLevels || !allowedLevels.includes(reasoningLevel)) {
        throw new BadRequestException(
          `Reasoning level "${reasoningLevel}" is not supported for provider "${providerName}"`,
        );
      }
    }
    const webSearchEnabled = rawWebSearchEnabled ?? false;
    const imageGenerationEnabled = rawImageGenerationEnabled ?? false;

    const modelName =
      imageGenerationEnabled && providerName === PROVIDER.GEMINI
        ? GEMINI_IMAGE_GEN_MODEL
        : modelDetails.name;

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

    let projectIdPromise = Promise.resolve(projectId ?? null);

    if (conversationId) {
      projectIdPromise = this.conversationService.getProjectId(
        currentConversationId,
      );
    }

    const [resolvedProjectId, userPrefs] = await Promise.all([
      projectIdPromise,
      this.userService.getUserPreferences(userId),
    ]);

    let projectInstructions: string | null = null;

    if (resolvedProjectId) {
      projectInstructions =
        await this.projectService.getProjectInstructions(resolvedProjectId);
    }

    const systemPrompt = this.buildSystemPrompt(
      userPrefs,
      projectInstructions,
      responseStyle,
    );

    const isRegenerate = !!regenerateFromMessageId;

    let anchorMessageId: string | null =
      regenerateFromMessageId ?? branchFromMessageId ?? null;

    if (!anchorMessageId) {
      anchorMessageId = await this.conversationService.getActiveLeafMessage(
        currentConversationId,
      );
    }

    const { messages: chatHistory } =
      await this.messageService.getMessagesByConversationId({
        conversationId: currentConversationId,
        anchorMessageId,
        followToLeaf: false,
      });

    let attachments: FileMetadataResponseDto[] = [];
    if (fileIds && fileIds.length > 0) {
      const filesMetadata =
        await this.fileService.getMultipleFilesMetadata(fileIds);
      attachments = filesMetadata.filter((f) => !f.error);
    }

    const documentAttachments = attachments.filter(
      (a) => !a.error && !this.isImageAttachment(a),
    );
    const { context: ragContext, ragFileIds } =
      documentAttachments.length > 0 && prompt
        ? await this.buildRagContext(documentAttachments, prompt, providerName)
        : { context: null, ragFileIds: [] as string[] };

    const historyMessages: LLMMessage[] = chatHistory.map((msg) => ({
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
    }));

    const lastHistoryMessageId =
      chatHistory.length > 0
        ? chatHistory[chatHistory.length - 1].id
        : undefined;

    let assistantParentMessageId: string | undefined;
    let messages: LLMMessage[];
    let titlePromise: Promise<void>;

    if (isRegenerate) {
      //* Regenerate: reuse the existing user message as-is, no new user message saved.
      //* The assistant response will be a new sibling of the existing one.
      messages = historyMessages;
      assistantParentMessageId = lastHistoryMessageId;
      titlePromise = Promise.resolve();
    } else {
      //* Normal send: append the new user prompt to the LLM context and persist it.
      const userMessageContent = ragContext
        ? `[Document Context]\n${ragContext}\n\n---\n${prompt ?? ''}`
        : (prompt ?? '');

      const nativeAttachments = this.filterAttachmentsForProvider(
        attachments,
        providerName,
        ragFileIds,
      );

      messages = [
        ...historyMessages,
        {
          content: userMessageContent,
          senderType: 'user',
          attachments: nativeAttachments
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

      const newUserMessage = await this.messageService.saveMessage({
        mainContent: prompt,
        senderType: SenderType.user,
        parentMessageId: lastHistoryMessageId,
        conversationId: currentConversationId,
        fileIds,
      });

      assistantParentMessageId = newUserMessage.id;

      titlePromise =
        chatHistory.length === 0
          ? this.generateAndSendTitle(
              currentConversationId,
              prompt ?? '',
              sendEvent,
            ).catch((err: unknown) =>
              this.logger.error(
                `Failed to generate conversation title: ${err instanceof Error ? err.message : String(err)}`,
              ),
            )
          : Promise.resolve();
    }

    let mainContentBuffer = '';
    let reasoningContentBuffer = '';

    const streamPromise = this.llmService.streamResponse(
      providerName,
      {
        model: modelName,
        conversationId: currentConversationId,
        messages,
        reasoningLevel,
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
        }
      },
    );

    const [streamResult] = await Promise.all([streamPromise, titlePromise]);

    let generatedFileId: string | undefined;
    if (streamResult?.imageBase64) {
      const finalImageBase64 = streamResult.imageBase64;
      try {
        const imageBuffer = Buffer.from(finalImageBase64, 'base64');
        generatedFileId = await this.fileService.uploadGeneratedImage(
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
      const newAssistantMessage = await this.messageService.saveMessage({
        mainContent: mainContentBuffer || undefined,
        reasoningContent: reasoningContentBuffer || undefined,
        senderType: SenderType.assistant,
        parentMessageId: assistantParentMessageId,
        conversationId: currentConversationId,
        modelId: lastModelId,
        fileIds: generatedFileId ? [generatedFileId] : undefined,
        openaiImageCallId: streamResult?.openaiImageCallId,
      });

      await this.conversationService.updateActiveLeafMessage(
        currentConversationId,
        newAssistantMessage.id,
      );

      sendEvent({
        type: 'stream-complete',
        conversationId: currentConversationId,
      });
    }
  }

  /**
   * Build RAG context for the current message by checking each non-image document attachment:
   * - Large doc (chunks stored in pgvector) → semantic retrieval of top-k chunks
   * - Small doc + non-native provider → full text extraction injected inline
   * - Small doc + OpenAI → no context needed (passed natively)
   */
  private async buildRagContext(
    documentAttachments: FileMetadataResponseDto[],
    query: string,
    providerName: string,
  ): Promise<{ context: string | null; ragFileIds: string[] }> {
    const ragFileIds: string[] = [];
    const injectFileIds: string[] = [];

    for (const attachment of documentAttachments) {
      const isProcessed = await this.ragService.isAlreadyProcessed(
        attachment.id,
      );
      if (isProcessed) {
        // Large doc: use RAG regardless of provider (too large to pass natively)
        ragFileIds.push(attachment.id);
      } else if (providerName.toLowerCase() !== 'openai') {
        // Small doc + non-OpenAI: inject full text inline
        injectFileIds.push(attachment.id);
      }
      // Small doc + OpenAI: no action here — passed natively via filterAttachmentsForProvider
    }

    const contextParts: string[] = [];

    if (ragFileIds.length > 0) {
      const chunks = await this.ragService.retrieveRelevantChunks(
        ragFileIds,
        query,
        3,
      );
      if (chunks) {
        contextParts.push(chunks);
      }
    }

    if (injectFileIds.length > 0) {
      const texts = await Promise.all(
        injectFileIds.map((id) => this.ragService.extractTextForSmallDoc(id)),
      );
      for (const text of texts) {
        if (text) {
          contextParts.push(text);
        }
      }
    }

    return {
      context: contextParts.length > 0 ? contextParts.join('\n\n') : null,
      ragFileIds,
    };
  }

  /**
   * Filter attachments to only those that can be passed natively to the provider.
   * OpenAI supports all document types natively.
   * All other providers only support images natively (documents are handled via RAG/injection).
   */
  private filterAttachmentsForProvider(
    attachments: FileMetadataResponseDto[],
    providerName: string,
    ragFileIds: string[] = [],
  ): FileMetadataResponseDto[] {
    if (providerName.toLowerCase() === 'openai') {
      // Exclude large docs already handled via RAG — sending them natively too
      // would duplicate content and defeat the purpose of chunking.
      return attachments.filter((a) => !ragFileIds.includes(a.id));
    }

    return attachments.filter((a) => this.isImageAttachment(a));
  }

  private isImageAttachment(attachment: FileMetadataResponseDto): boolean {
    return !!attachment.mimeType?.startsWith('image/');
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
