import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: SessionUser }>();
    return request.user;
  },
);
