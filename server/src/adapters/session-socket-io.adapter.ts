import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { INestApplication } from '@nestjs/common';
import { RequestHandler } from 'express';
import passport from 'passport';

export class SessionSocketIoAdapter extends IoAdapter {
  constructor(
    private readonly app: INestApplication,
    private readonly sessionMiddleware: RequestHandler,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);

    server.engine.use(this.sessionMiddleware);
    server.engine.use(passport.initialize());
    server.engine.use(passport.session());

    return server;
  }
}
