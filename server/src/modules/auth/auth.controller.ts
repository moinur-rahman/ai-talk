import {
  Controller,
  Post,
  UseGuards,
  Request,
  Response,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { AuthService } from './auth.service.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import config from '../../common/config/config.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Request() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ): void {
    req.session.destroy(() => {
      res.clearCookie('connect.sid', { path: '/', domain: config.domain });
      res.sendStatus(HttpStatus.NO_CONTENT);
    });
  }
}
