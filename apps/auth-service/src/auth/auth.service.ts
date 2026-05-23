import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserRole } from '@prisma/client';
import { logger } from '@rewards/logger';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        password: hashed,
        role: UserRole.CUSTOMER,
        rewardAccount: { create: { balance: 500 } },
        wallet: { create: { balance: 0.0 } },
      },
    });

    // Record signup bonus transaction
    const rewardAccount = await this.prisma.rewardAccount.findUnique({
      where: { userId: user.id },
    });
    if (rewardAccount) {
      await this.prisma.rewardTransaction.create({
        data: {
          rewardAccountId: rewardAccount.id,
          points: 500,
          type: 'CREDIT',
          reason: 'SIGNUP_BONUS',
          referenceId: user.id,
        },
      });
      await this.prisma.rewardAccount.update({
        where: { id: rewardAccount.id },
        data: { totalEarned: 500 },
      });
    }

    logger.info({ userId: user.id, email: user.email }, 'User registered');

    const tokens = await this.generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    logger.info({ userId: user.id }, 'User logged in');

    const tokens = await this.generateTokens(user);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(stored.user);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    logger.info({ userId }, 'User logged out');
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const expiresIn = parseInt(this.config.get('AUTH_JWT_EXPIRATION', '3600'), 10);

    const accessToken = this.jwtService.sign(payload, { expiresIn });

    const refreshTokenValue = uuidv4();
    const refreshExpiresIn = parseInt(this.config.get('AUTH_JWT_REFRESH_EXPIRATION', '604800'), 10);
    const expiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, token: refreshTokenValue, expiresAt },
    });

    return { accessToken, refreshToken: refreshTokenValue, expiresIn };
  }

  async validateUser(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) return null;
    const { password: _, ...result } = user;
    return result;
  }

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const { password: _, ...result } = user;
    return result;
  }
}
