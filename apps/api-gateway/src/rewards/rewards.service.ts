import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RewardStrategyExecutor } from './strategies/reward-strategy.executor';
import { AwardPointsDto } from './dto/award-points.dto';
import { logger } from '../logger';

@Injectable()
export class RewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly executor: RewardStrategyExecutor,
  ) {}

  async getBalance(userId: string) {
    const account = await this.prisma.rewardAccount.findUnique({ where: { userId } });
    if (!account) throw new NotFoundException('Reward account not found');
    return account;
  }

  async awardPoints(dto: AwardPointsDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId, isActive: true } });
    if (!user) throw new NotFoundException('User not found');

    const result = this.executor.execute(dto.eventType, {
      userId: dto.userId,
      referenceId: dto.referenceId,
      metadata: dto.metadata,
    });

    const account = await this.prisma.rewardAccount.upsert({
      where: { userId: dto.userId },
      create: { userId: dto.userId, balance: result.points, totalEarned: result.points },
      update: {
        balance: { increment: result.points },
        totalEarned: { increment: result.points },
        version: { increment: 1 },
      },
    });

    const transaction = await this.prisma.rewardTransaction.create({
      data: {
        rewardAccountId: account.id,
        points: result.points,
        type: 'CREDIT',
        reason: result.reason,
        referenceId: dto.referenceId,
      },
    });

    logger.info({ userId: dto.userId, points: result.points, reason: result.reason }, 'Points awarded');
    return { account, transaction, pointsAwarded: result.points };
  }

  async getHistory(userId: string, skip = 0, take = 20) {
    const account = await this.prisma.rewardAccount.findUnique({ where: { userId } });
    if (!account) throw new NotFoundException('Reward account not found');

    const [data, total] = await this.prisma.$transaction([
      this.prisma.rewardTransaction.findMany({
        where: { rewardAccountId: account.id },
        skip, take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rewardTransaction.count({ where: { rewardAccountId: account.id } }),
    ]);

    return { data, total, balance: account.balance };
  }
}
