import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { RedemptionModule } from './redemption/redemption.module';
import { AuthSharedModule } from './auth-shared/auth-shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthSharedModule,
    WalletModule,
    RedemptionModule,
  ],
})
export class AppModule {}
