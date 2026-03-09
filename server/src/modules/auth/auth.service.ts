import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../providers/prisma/prisma.service.js';
import { UserPayload } from './auth.types.js';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserPayload | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  login(user: UserPayload): UserPayload {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
