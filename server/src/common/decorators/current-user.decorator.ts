import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
