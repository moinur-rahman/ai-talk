import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ModelService } from '../model/model.service.js';
import { MessageService } from '../chat/message/message.service.js';
import { FileService } from '../file/file.service.js';
import { ConversationService } from '../chat/conversation/conversation.service.js';
import { LlmService } from '../llm/llm.service.js';
import { LLMMessage, TokenType } from '../llm/types/llm.types.js';
import { FileMetadataResponseDto } from '../file/dto/file-metadata-response.dto.js';
import { SenderType } from '../chat/message/dto/save-message.dto.js';
import { SessionUser } from '../../common/decorators/current-user.decorator.js';
import config from '../../common/config/config.js';

interface GetLLMResponseData {
  prompt: string;
  conversationId: string;
  lastModelId: string;
  enableReasoning?: boolean;
  fileIds?: string[];
}

@WebSocketGateway({
  namespace: '/provider',
  cors: { origin: config.clientUrl, credentials: true },
})
export class ProviderGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ProviderGateway.name);
  private readonly activeStreams = new Map<
    string,
    { providerName: string; conversationId: string }
  >();

  constructor(
    private readonly modelService: ModelService,
    private readonly messageService: MessageService,
    private readonly fileService: FileService,
    private readonly conversationService: ConversationService,
    private readonly llmService: LlmService,
  ) {}

  handleConnection(client: Socket) {
    const req = client.request as { user?: SessionUser };
    if (!req.user) {
      this.logger.warn(
        `Unauthenticated connection attempt from ${client.handshake.address}`,
      );
      client.disconnect(true);
      return;
    }
    this.logger.log(`User ${req.user.email} connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const activeStream = this.activeStreams.get(client.id);
    if (activeStream) {
      this.llmService.stopStream(
        activeStream.providerName,
        activeStream.conversationId,
      );
      this.activeStreams.delete(client.id);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    await client.join(conversationId);
    return { success: true };
  }

  @SubscribeMessage('get-llm-response')
  async handleGetLLMResponse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GetLLMResponseData,
  ) {
    try {
      const modelDetails = await this.modelService.getModelDetails(
        data.lastModelId,
      );
      const providerName = modelDetails.provider.name.toLowerCase();
      const enableReasoning = Boolean(
        data.enableReasoning && modelDetails.hasReasoning,
      );

      this.activeStreams.set(client.id, {
        providerName,
        conversationId: data.conversationId,
      });

      // Get existing chat history
      const { messages: chatHistory } =
        await this.messageService.getMessagesByConversationId(
          data.conversationId,
        );

      // Get file metadata for attachments on the new user message
      let attachments: FileMetadataResponseDto[] = [];
      if (data.fileIds && data.fileIds.length > 0) {
        const filesMetadata = await this.fileService.getMultipleFilesMetadata(
          data.fileIds,
        );
        attachments = filesMetadata.filter((f) => !f.error);
      }

      // Build full message list for the LLM
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
            })),
        })),
        {
          content: data.prompt,
          senderType: 'user',
          attachments: attachments
            .filter((a) => a.fileName && a.mimeType)
            .map((a) => ({
              id: a.id,
              fileName: a.fileName!,
              mimeType: a.mimeType!,
              fileSize: a.fileSize ?? '0',
              presignedUrl: a.presignedUrl,
            })),
        },
      ];

      // Save the user message to the database
      await this.messageService.saveMessage({
        mainContent: data.prompt,
        senderType: SenderType.user,
        conversationId: data.conversationId,
        lastProviderId: modelDetails.provider.id,
        lastModelId: data.lastModelId,
        fileIds: data.fileIds,
      });

      // Generate conversation title on first message
      if (chatHistory.length === 0) {
        this.generateAndEmitTitle(data.conversationId, data.prompt).catch(
          (err: unknown) =>
            this.logger.error(
              `Failed to generate conversation title: ${err instanceof Error ? err.message : String(err)}`,
            ),
        );
      }

      // Buffers for accumulating the full assistant response
      let mainContentBuffer = '';
      let reasoningContentBuffer = '';

      // Stream the LLM response
      await this.llmService.streamResponse(
        providerName,
        {
          model: modelDetails.name,
          conversationId: data.conversationId,
          messages,
          enableReasoning,
        },
        async (token: string, tokenType: TokenType, isEnd: boolean) => {
          if (tokenType === 'mainContent') {
            mainContentBuffer += token;
          } else if (tokenType === 'reasoningContent') {
            reasoningContentBuffer += token;
          }

          this.server.to(data.conversationId).emit('token', {
            token,
            tokenType,
            isEnd,
            conversationId: data.conversationId,
          });

          // When main content stream ends, persist the assistant message
          if (tokenType === 'mainContent' && isEnd) {
            if (mainContentBuffer || reasoningContentBuffer) {
              await this.messageService.saveMessage({
                mainContent: mainContentBuffer,
                reasoningContent: reasoningContentBuffer || undefined,
                senderType: SenderType.assistant,
                conversationId: data.conversationId,
              });
            }
          }
        },
      );
    } catch (error: unknown) {
      this.logger.error(
        `Error in get-llm-response: ${error instanceof Error ? error.message : String(error)}`,
      );
      client.emit('error', {
        message: 'Error fetching provider response',
        conversationId: data.conversationId,
      });
    } finally {
      this.activeStreams.delete(client.id);
    }
  }

  @SubscribeMessage('stop-stream')
  handleStopStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const activeStream = this.activeStreams.get(client.id);
    if (activeStream) {
      this.llmService.stopStream(
        activeStream.providerName,
        data.conversationId,
      );
      this.activeStreams.delete(client.id);
    }
  }

  private async generateAndEmitTitle(
    conversationId: string,
    conversationText: string,
  ): Promise<void> {
    const title =
      await this.llmService.generateConversationTitle(conversationText);
    await this.conversationService.updateTitle(conversationId, title);
    this.server.to(conversationId).emit('conversation-title', {
      title,
      conversationId,
    });
  }
}
