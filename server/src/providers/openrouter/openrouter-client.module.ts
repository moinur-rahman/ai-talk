import { Global, Module } from '@nestjs/common';
import OpenAI from 'openai';
import config from '../../common/config/config.js';
import { OPENROUTER_CLIENT } from '../ai-client.tokens.js';

@Global()
@Module({
  providers: [
    {
      provide: OPENROUTER_CLIENT,
      useFactory: () =>
        new OpenAI({
          apiKey: config.openrouterApiKey,
          baseURL: 'https://openrouter.ai/api/v1',
        }),
    },
  ],
  exports: [OPENROUTER_CLIENT],
})
export class OpenRouterClientModule {}
