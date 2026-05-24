import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RewardsModule } from './rewards/rewards.module';
import { WalletModule } from './wallet/wallet.module';
import { RedemptionModule } from './redemption/redemption.module';

@Module({
  imports: [
    // ── Config (global — available everywhere via ConfigService) ─────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      // Fail fast if a required variable is missing
      validationOptions: { allowUnknown: false, abortEarly: true },
    }),

    // ── Rate limiting (values from .env) ─────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.getOrThrow<number>('THROTTLE_TTL'),
          limit: config.getOrThrow<number>('THROTTLE_LIMIT'),
        },
      ],
    }),

    // ── Shared database ───────────────────────────────────────────────────────
    PrismaModule,

    // ── Feature modules ───────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    RewardsModule,
    WalletModule,
    RedemptionModule,
  ],
})
export class AppModule {}
