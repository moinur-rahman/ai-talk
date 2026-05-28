import { Global, Module } from '@nestjs/common';
import OpenAI from 'openai';
import config from '../../common/config/config.js';
import { ZAI_CLIENT } from '../ai-client.tokens.js';

@Global()
@Module({
  providers: [
    {
      provide: ZAI_CLIENT,
      useFactory: () =>
        new OpenAI({
          apiKey: config.zaiApiKey,
          baseURL: 'https://api.z.ai/api/coding/paas/v4',
        }),
    },
  ],
  exports: [ZAI_CLIENT],
})
export class ZaiClientModule {}
