import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import session from 'express-session';
import passport from 'passport';
import { RedisStore } from 'connect-redis';
import { RedisService } from './providers/redis/redis.service.js';
import config from './common/config/config.js';
import { SESSION_KEY_PREFIX } from './common/config/constants.js';

const SESSION_TIMEOUT = config.sessionTimeout * 1000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const redisService = app.get(RedisService);

  const redisStore = new RedisStore({
    client: redisService.getClient(),
    prefix: SESSION_KEY_PREFIX,
    ttl: SESSION_TIMEOUT,
    disableTouch: true,
  });

  app.use(
    session({
      store: redisStore,
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: false,
      cookie: {
        httpOnly: true,
        secure: config.nodeEnv !== 'development',
        sameSite: config.nodeEnv === 'development' ? 'lax' : 'strict',
        path: '/',
        domain: config.domain,
        maxAge: SESSION_TIMEOUT,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({
    origin: config.clientUrl,
    credentials: true,
  });

  await app.listen(config.port);
  console.log(`Application is running on: http://localhost:${config.port}/api`);
}
bootstrap();
