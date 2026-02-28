import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { Reasoning } from 'openai/resources';
import type {
  ResponseInput,
  ResponseInputContent,
  ResponseInputMessageContentList,
} from 'openai/resources/responses/responses';
import config from '../../../common/config/config.js';
import {
  FileMetadata,
  LLMMessage,
  LLMRequest,
  TokenCallback,
} from '../types/llm.types.js';
import {
  LATEX_SYSTEM_INSTRUCTION,
  TITLE_SYSTEM_PROMPT,
  buildTitleUserPrompt,
} from '../llm.prompts.js';
import { fetchBase64FromPresignedUrl } from '../llm.utils.js';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly client: OpenAI;
  private readonly activeStreams: Map<string, AbortController> = new Map();

  constructor() {
    this.client = new OpenAI({ apiKey: config.openaiApiKey });
  }

  async streamResponse(
    request: LLMRequest,
    onToken: TokenCallback,
  ): Promise<void> {
    const abortController = new AbortController();
    this.activeStreams.set(request.conversationId, abortController);

    try {
      const input = await this.prepareResponseInput(request.messages);

      const reasoning =
        request.enableReasoning && /^o\d(-|$)/.test(request.model)
          ? ({ effort: 'low', summary: 'auto' } as Reasoning)
          : null;

      const stream = await this.client.responses.create(
        { model: request.model, input, stream: true, reasoning },
        { signal: abortController.signal },
      );

      let mainContentEnded = false;

      for await (const event of stream) {
        if (abortController.signal.aborted) break;

        if (event.type === 'response.output_text.delta') {
          await onToken(event.delta, 'mainContent', false);
        } else if (event.type === 'response.output_text.done') {
          mainContentEnded = true;
          await onToken('', 'mainContent', true);
        } else if (event.type === 'response.reasoning_summary_text.delta') {
          await onToken(event.delta, 'reasoningContent', false);
        } else if (event.type === 'response.reasoning_summary_text.done') {
          await onToken('', 'reasoningContent', true);
        }
      }

      if (abortController.signal.aborted && !mainContentEnded) {
        await onToken('', 'mainContent', true);
      }
    } catch (error) {
      if (abortController.signal.aborted) {
        await onToken('', 'mainContent', true);
      } else {
        throw error;
      }
    } finally {
      this.activeStreams.delete(request.conversationId);
    }
  }

  async listModels(): Promise<
    { name: string; description: string; hasReasoning: boolean }[]
  > {
    try {
      const models: {
        name: string;
        description: string;
        hasReasoning: boolean;
      }[] = [];
      for await (const model of this.client.models.list()) {
        if (model.owned_by === 'openai' && /^(gpt-|o\d)/.test(model.id)) {
          models.push({
            name: model.id,
            description: '',
            hasReasoning: /^o\d(-|$)/.test(model.id),
          });
        }
      }
      return models;
    } catch (error) {
      this.logger.warn('Failed to list OpenAI models', error);
      return [];
    }
  }

  async generateTitle(text: string, model: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: TITLE_SYSTEM_PROMPT },
        { role: 'user', content: buildTitleUserPrompt(text) },
      ],
      stream: false,
    });

    return response.choices[0]?.message?.content?.trim() ?? '';
  }

  stopStream(conversationId: string): void {
    const abortController = this.activeStreams.get(conversationId);
    if (abortController) {
      abortController.abort();
      this.activeStreams.delete(conversationId);
    } else {
      this.logger.log(
        `No active OpenAI stream found for conversation ${conversationId}`,
      );
    }
  }

  private async prepareResponseInput(
    messages: LLMMessage[],
  ): Promise<ResponseInput> {
    const systemInstruction = {
      role: 'developer',
      content: LATEX_SYSTEM_INSTRUCTION,
    };

    const processedMessages = await Promise.all(
      messages.map(async (message) => {
        if (message.attachments.length > 0) {
          const content = await this.processMessageWithFiles(message);
          return { role: message.senderType, content };
        }
        return { role: message.senderType, content: message.content };
      }),
    );

    return [systemInstruction, ...processedMessages] as ResponseInput;
  }

  private async processMessageWithFiles(
    message: LLMMessage,
  ): Promise<ResponseInputMessageContentList> {
    const filesWithUrls = message.attachments.filter((a) => !!a.presignedUrl);
    const fileContents = await this.processFiles(filesWithUrls);
    fileContents.push({ type: 'input_text', text: message.content });
    return fileContents;
  }

  private async processFiles(
    files: FileMetadata[],
  ): Promise<ResponseInputMessageContentList> {
    const contents = await Promise.all(files.map((f) => this.processFile(f)));
    return contents.filter(
      (item): item is ResponseInputContent => item !== undefined,
    );
  }

  private async processFile(
    file: FileMetadata,
  ): Promise<ResponseInputContent | undefined> {
    const base64 = await fetchBase64FromPresignedUrl(file.presignedUrl!);

    if (file.mimeType.startsWith('image/')) {
      return {
        type: 'input_image',
        image_url: `data:${file.mimeType};base64,${base64}`,
        detail: 'low',
      };
    } else if (file.mimeType.startsWith('application/pdf')) {
      return {
        type: 'input_file',
        filename: file.fileName,
        file_data: `data:${file.mimeType};base64,${base64}`,
      };
    }

    return undefined;
  }
}
