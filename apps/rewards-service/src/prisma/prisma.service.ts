import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { logger } from '@rewards/logger';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ log: [{ emit: 'event', level: 'error' }] });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    logger.info('RewardsService PrismaService connected');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
