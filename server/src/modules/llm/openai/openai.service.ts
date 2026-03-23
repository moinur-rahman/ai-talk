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
  StreamResult,
  TokenCallback,
} from '../types/llm.types.js';
import {
  buildSystemInstruction,
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
  ): Promise<StreamResult> {
    const abortController = new AbortController();
    this.activeStreams.set(request.conversationId, abortController);

    try {
      const input = await this.prepareResponseInput(
        request.messages,
        request.systemPrompt,
      );

      const reasoning = request.enableReasoning
        ? ({ effort: 'low', summary: 'auto' } as Reasoning)
        : null;

      const tools: Parameters<typeof this.client.responses.create>[0]['tools'] =
        [
          {
            type: 'image_generation',
            model: 'gpt-image-1-mini',
            size: '1024x1024',
            quality: 'low',
            partial_images: 2,
          },
          { type: 'web_search' as const },
        ];

      const toolChoice = request.webSearchEnabled
        ? ({ type: 'web_search' } as unknown as Parameters<
            typeof this.client.responses.create
          >[0]['tool_choice'])
        : undefined;

      const stream = await this.client.responses.create(
        {
          model: request.model,
          input,
          stream: true,
          reasoning,
          tools,
          ...(toolChoice ? { tool_choice: toolChoice } : {}),
        },
        { signal: abortController.signal },
      );

      let mainContentEnded = false;
      let lastImageB64 = '';
      let hasImageOutput = false;
      let openaiImageCallId: string | undefined;

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
        } else if (
          (event as { type: string }).type ===
          'response.web_search_call.in_progress'
        ) {
          await onToken('', 'webSearch', false);
        } else if (
          (event as { type: string }).type ===
          'response.web_search_call.completed'
        ) {
          await onToken('', 'webSearch', true);
        } else if (
          event.type === 'response.image_generation_call.partial_image'
        ) {
          hasImageOutput = true;
          openaiImageCallId = event.item_id;
          lastImageB64 = event.partial_image_b64;
          await onToken(lastImageB64, 'partialImage', false);
        }
      }

      if (hasImageOutput && lastImageB64) {
        await onToken(lastImageB64, 'partialImage', true);
      }

      if (!mainContentEnded) {
        await onToken('', 'mainContent', true);
      }

      return { openaiImageCallId };
    } catch (error) {
      if (abortController.signal.aborted) {
        await onToken('', 'mainContent', true);
        return {};
      } else {
        throw error;
      }
    } finally {
      this.activeStreams.delete(request.conversationId);
    }
  }

  async listModels(): Promise<{ name: string; description: string }[]> {
    try {
      const models: { name: string; description: string }[] = [];
      for await (const model of this.client.models.list()) {
        models.push({ name: model.id, description: '' });
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

  async generateImage(
    prompt: string,
    model: 'gpt-image-1' | 'gpt-image-1-mini',
    size: '1024x1024' | '1536x1024' | '1024x1536',
    quality: 'low' | 'medium' | 'high',
  ): Promise<{ imageDataUrl: string }> {
    const response = (await this.client.images.generate({
      model,
      prompt,
      n: 1,
      size,
      quality,
      stream: false,
    } as Parameters<typeof this.client.images.generate>[0])) as {
      data: { b64_json?: string }[];
    };

    const b64 = response.data[0]?.b64_json ?? '';
    return { imageDataUrl: `data:image/png;base64,${b64}` };
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
    systemPrompt?: string,
  ): Promise<ResponseInput> {
    const systemInstruction = {
      role: 'developer',
      content: buildSystemInstruction(systemPrompt),
    };

    // Each message maps to one or more input items (image_generation_call is a
    // top-level sibling in the input array, not nested inside an assistant message).
    const processedItems = (
      await Promise.all(
        messages.map(async (message) => {
          if (message.senderType === 'assistant') {
            if (message.openaiImageCallId) {
              const items: unknown[] = [];
              // Include any text the assistant produced alongside the image
              if (message.content) {
                items.push({ role: 'assistant', content: message.content });
              }
              // The image_generation_call reference must be a top-level input item
              items.push({
                type: 'image_generation_call',
                id: message.openaiImageCallId,
              });
              return items;
            }
            // Skip image-only assistant messages whose call ID has gone (fallback)
            if (!message.content) return null;
            return [{ role: 'assistant', content: message.content }];
          }

          if (message.senderType === 'user' && message.attachments.length > 0) {
            const content = await this.processMessageWithFiles(message);
            return [{ role: 'user', content }];
          }
          return [{ role: 'user', content: message.content }];
        }),
      )
    )
      .filter((items): items is unknown[] => items !== null)
      .flat();

    return [systemInstruction, ...processedItems] as ResponseInput;
  }

  private async processMessageWithFiles(
    message: LLMMessage,
  ): Promise<ResponseInputMessageContentList> {
    const filesWithUrls = message.attachments.filter(
      (a) => !!(a.storageUrl ?? a.presignedUrl),
    );
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
    const base64 = await fetchBase64FromPresignedUrl(
      (file.storageUrl ?? file.presignedUrl)!,
    );

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
