import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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

// All text/* MIME types are supported (covers plain text, markdown, all code formats, CSV, etc.)
// The following application/* types are explicitly supported per OpenAI's file inputs docs.
const SUPPORTED_APPLICATION_MIME_TYPES = new Set([
  'application/pdf',
  // Spreadsheets
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/csv',
  'application/x-iif',
  'application/vnd.google-apps.spreadsheet',
  // Rich documents
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/rtf',
  'application/vnd.oasis.opendocument.text', // .odt
  'application/vnd.apple.pages',
  'application/vnd.google-apps.document',
  'application/vnd.apple.iwork',
  // Presentations
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.apple.keynote',
  'application/vnd.google-apps.presentation',
  // Code / text-as-application
  'application/javascript',
  'application/typescript',
  'application/json',
  'application/xml',
  'application/x-sql',
  'application/x-scala',
  'application/x-rust',
  'application/x-powershell',
  'application/x-patch',
  'application/x-php',
  'application/x-httpd-php',
  'application/x-httpd-php-source',
  'application/x-bash',
  'application/x-awk',
  'application/graphql',
  'application/x-graphql',
  'application/x-ndjson',
  'application/json5',
  'application/x-json5',
  'application/toml',
  'application/x-toml',
  'application/x-yaml',
  'application/yaml',
  'application/x-subrip',
  'application/x-protobuf',
  'application/x-terraform',
]);

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

      const reasoning = request.reasoningLevel
        ? ({
            effort: request.reasoningLevel as Reasoning['effort'],
            summary: 'auto',
          } as Reasoning)
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

      type ToolChoice = Parameters<
        typeof this.client.responses.create
      >[0]['tool_choice'];
      let forcedTool: string | null = null;
      if (request.webSearchEnabled) {
        forcedTool = 'web_search';
      } else if (request.imageGenerationEnabled) {
        forcedTool = 'image_generation';
      }
      const toolChoice = forcedTool
        ? ({ type: forcedTool } as unknown as ToolChoice)
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

        const ev = event as unknown as Record<string, string>;
        switch (ev['type']) {
          case 'response.output_text.delta':
            await onToken(ev['delta'], 'mainContent', false);
            break;
          case 'response.output_text.done':
            mainContentEnded = true;
            await onToken('', 'mainContent', true);
            break;
          case 'response.reasoning_summary_text.delta':
            await onToken(ev['delta'], 'reasoningContent', false);
            break;
          case 'response.reasoning_summary_text.done':
            await onToken('', 'reasoningContent', true);
            break;
          case 'response.web_search_call.in_progress':
            await onToken('', 'webSearch', false);
            break;
          case 'response.web_search_call.completed':
            await onToken('', 'webSearch', true);
            break;
          case 'response.image_generation_call.partial_image':
            hasImageOutput = true;
            openaiImageCallId = ev['item_id'];
            lastImageB64 = ev['partial_image_b64'];
            await onToken(lastImageB64, 'partialImage', false);
            break;
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
    const { mimeType } = file;
    const isSupported =
      mimeType.startsWith('image/') ||
      mimeType.startsWith('text/') ||
      SUPPORTED_APPLICATION_MIME_TYPES.has(mimeType);

    if (!isSupported) {
      throw new BadRequestException(
        `File type "${mimeType}" is not supported. Please upload an image, PDF, document, spreadsheet, presentation, or text/code file.`,
      );
    }

    const base64 = await fetchBase64FromPresignedUrl(
      (file.storageUrl ?? file.presignedUrl)!,
    );

    if (mimeType.startsWith('image/')) {
      return {
        type: 'input_image',
        image_url: `data:${mimeType};base64,${base64}`,
        detail: 'low',
      };
    }

    return {
      type: 'input_file',
      filename: file.fileName,
      file_data: `data:${mimeType};base64,${base64}`,
    };
  }
}
