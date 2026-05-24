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
import { logger } from '../logger';

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
  private readonly signupBonusPoints: number;
  private readonly jwtExpiration: number;
  private readonly refreshExpiration: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.signupBonusPoints = config.getOrThrow<number>('SIGNUP_BONUS_POINTS');
    this.jwtExpiration = config.getOrThrow<number>('AUTH_JWT_EXPIRATION');
    this.refreshExpiration = config.getOrThrow<number>('AUTH_JWT_REFRESH_EXPIRATION');
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        password: hashed,
        role: UserRole.CUSTOMER,
        rewardAccount: {
          create: { balance: this.signupBonusPoints, totalEarned: this.signupBonusPoints },
        },
        wallet: { create: { balance: 0.0 } },
      },
    });

    // Record the signup bonus transaction
    const account = await this.prisma.rewardAccount.findUnique({ where: { userId: user.id } });
    if (account) {
      await this.prisma.rewardTransaction.create({
        data: {
          rewardAccountId: account.id,
          points: this.signupBonusPoints,
          type: 'CREDIT',
          reason: 'SIGNUP_BONUS',
          referenceId: user.id,
        },
      });
    }

    logger.info({ userId: user.id, email: user.email }, 'User registered');

    const tokens = await this.generateTokens(user);
    const { password: _, ...safe } = user;
    return { user: safe, tokens };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    logger.info({ userId: user.id }, 'User logged in');

    const tokens = await this.generateTokens(user);
    const { password: _, ...safe } = user;
    return { user: safe, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token (rotation)
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

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const { password: _, ...safe } = user;
    return safe;
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: this.jwtExpiration });

    const refreshTokenValue = uuidv4();
    const expiresAt = new Date(Date.now() + this.refreshExpiration * 1000);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, token: refreshTokenValue, expiresAt },
    });

    return { accessToken, refreshToken: refreshTokenValue, expiresIn: this.jwtExpiration };
  }
}
