import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { RedemptionStatus } from '@prisma/client';
import { logger } from '../logger';

@Injectable()
export class RedemptionService {
  private readonly conversionRate: number;   // points needed per $1  (from env)
  private readonly minPoints: number;         // minimum redeemable   (from env)

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.conversionRate = config.getOrThrow<number>('POINTS_TO_MONEY_CONVERSION');
    this.minPoints      = config.getOrThrow<number>('REDEMPTION_MIN_POINTS');
  }

  async redeem(userId: string, dto: RedeemPointsDto) {
    // ── Minimum points guard (from env) ──────────────────────────────────────
    if (dto.points < this.minPoints) {
      throw new BadRequestException(
        `Minimum redemption is ${this.minPoints} points`,
      );
    }

    // ── Idempotency — return existing result for duplicate key ───────────────
    const existing = await this.prisma.redemptionRequest.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      if (existing.userId !== userId) throw new ConflictException('Idempotency key belongs to another user');
      return existing;
    }

    const [rewardAccount, wallet] = await Promise.all([
      this.prisma.rewardAccount.findUnique({ where: { userId } }),
      this.prisma.wallet.findUnique({ where: { userId } }),
    ]);

    if (!rewardAccount) throw new NotFoundException('Reward account not found');
    if (!wallet)         throw new NotFoundException('Wallet not found');

    if (rewardAccount.balance < dto.points) {
      throw new BadRequestException(
        `Insufficient balance — available: ${rewardAccount.balance}, requested: ${dto.points}`,
      );
    }

    const amountAwarded = +(dto.points / this.conversionRate).toFixed(2);

    // Create PENDING record first (safe to retry)
    const redemption = await this.prisma.redemptionRequest.create({
      data: {
        userId,
        rewardAccountId: rewardAccount.id,
        walletId: wallet.id,
        points: dto.points,
        amountAwarded,
        status: RedemptionStatus.PENDING,
        idempotencyKey: dto.idempotencyKey,
      },
    });

    try {
      // ── Atomic: deduct points + credit wallet in one transaction ─────────
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.rewardAccount.update({
          where: { id: rewardAccount.id },
          data: {
            balance:      { decrement: dto.points },
            totalRedeemed: { increment: dto.points },
            version:      { increment: 1 },
          },
        });

        if (updated.balance < 0) {
          throw new BadRequestException('Concurrent balance conflict — please retry');
        }

        await tx.rewardTransaction.create({
          data: {
            rewardAccountId: rewardAccount.id,
            points: dto.points,
            type: 'DEBIT',
            reason: 'REDEMPTION',
            referenceId: redemption.id,
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amountAwarded }, version: { increment: 1 } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId,
            amount: amountAwarded,
            type: 'CREDIT',
            status: 'COMPLETED',
            reason: 'REWARD_REDEMPTION',
            referenceId: redemption.id,
          },
        });

        await tx.redemptionRequest.update({
          where: { id: redemption.id },
          data: { status: RedemptionStatus.COMPLETED, processedAt: new Date() },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'REDEEM_POINTS',
            resourceType: 'RedemptionRequest',
            resourceId: redemption.id,
            changes: { pointsRedeemed: dto.points, amountAwarded, conversionRate: this.conversionRate },
          },
        });
      });

      logger.info({ userId, points: dto.points, amountAwarded }, 'Redemption completed');

      return this.prisma.redemptionRequest.findUniqueOrThrow({ where: { id: redemption.id } });
    } catch (error) {
      await this.prisma.redemptionRequest.update({
        where: { id: redemption.id },
        data: { status: RedemptionStatus.FAILED, failureReason: (error as Error).message },
      });
      logger.error({ userId, redemptionId: redemption.id, error }, 'Redemption failed');
      throw error;
    }
  }

  async getHistory(userId: string, skip = 0, take = 20) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.redemptionRequest.findMany({
        where: { userId }, skip, take, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.redemptionRequest.count({ where: { userId } }),
    ]);
    return { data, total };
  }

  async getById(id: string, userId: string) {
    const r = await this.prisma.redemptionRequest.findFirst({ where: { id, userId } });
    if (!r) throw new NotFoundException('Redemption not found');
    return r;
  }
}
