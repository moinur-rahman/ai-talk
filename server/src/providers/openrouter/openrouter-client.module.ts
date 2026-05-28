import { Global, Module } from '@nestjs/common';
import { OpenRouter } from '@openrouter/sdk';
import config from '../../common/config/config.js';
import { OPENROUTER_CLIENT } from '../ai-client.tokens.js';

@Global()
@Module({
  providers: [
    {
      provide: OPENROUTER_CLIENT,
      useFactory: () => new OpenRouter({ apiKey: config.openrouterApiKey }),
    },
  ],
  exports: [OPENROUTER_CLIENT],
})
export class OpenRouterClientModule {}
