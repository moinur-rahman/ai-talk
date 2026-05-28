import { Global, Module } from '@nestjs/common';
import OpenAI from 'openai';
import config from '../../common/config/config.js';
import { OPENAI_CLIENT } from '../ai-client.tokens.js';

@Global()
@Module({
  providers: [
    {
      provide: OPENAI_CLIENT,
      useFactory: () => new OpenAI({ apiKey: config.openaiApiKey }),
    },
  ],
  exports: [OPENAI_CLIENT],
})
export class OpenAIClientModule {}
