import { Global, Module } from '@nestjs/common';
import { Ollama } from 'ollama';
import config from '../../common/config/config.js';
import { OLLAMA_CLIENT } from '../ai-client.tokens.js';

@Global()
@Module({
  providers: [
    {
      provide: OLLAMA_CLIENT,
      useFactory: () => new Ollama({ host: config.ollamaHost }),
    },
  ],
  exports: [OLLAMA_CLIENT],
})
export class OllamaClientModule {}
