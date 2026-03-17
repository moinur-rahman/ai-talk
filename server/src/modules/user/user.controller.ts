import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import {
  CurrentUser,
  type SessionUser,
} from '../../common/decorators/current-user.decorator.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@CurrentUser() user: SessionUser) {
    return this.userService.getMe(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: SessionUser, @Body() dto: UpdateUserDto) {
    return this.userService.updateMe(user.id, dto);
  }

  @Public()
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createUser(createUserDto);
    return {
      messageCode: 'SUCCESS',
      data: user,
    };
  }
}
