import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedemptionRequest, RedemptionStatus } from '@prisma/client';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { logger } from '@rewards/logger';

@Injectable()
export class RedemptionService {
  private readonly pointsToMoney: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    this.pointsToMoney = parseInt(
      this.config.get('POINTS_TO_MONEY_CONVERSION', '100'),
      10
    );
  }

  async redeemPoints(userId: string, dto: RedeemPointsDto): Promise<RedemptionRequest> {
    // Idempotency check — return existing result if key already processed
    const existing = await this.prisma.redemptionRequest.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      if (existing.userId !== userId) {
        throw new ConflictException('Idempotency key belongs to a different user');
      }
      return existing;
    }

    const rewardAccount = await this.prisma.rewardAccount.findUnique({ where: { userId } });
    if (!rewardAccount) throw new NotFoundException('Reward account not found');

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    if (rewardAccount.balance < dto.points) {
      throw new BadRequestException(
        `Insufficient reward balance. Available: ${rewardAccount.balance}, Required: ${dto.points}`
      );
    }

    const amountAwarded = dto.points / this.pointsToMoney;

    // Create pending redemption request
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
      // Atomic: deduct points and credit wallet in a single transaction
      await this.prisma.$transaction(async (tx) => {
        // Deduct reward points
        const updatedAccount = await tx.rewardAccount.update({
          where: { id: rewardAccount.id },
          data: {
            balance: { decrement: dto.points },
            totalRedeemed: { increment: dto.points },
            version: { increment: 1 },
          },
        });

        // Guard against race conditions
        if (updatedAccount.balance < 0) {
          throw new BadRequestException('Insufficient balance after concurrent check');
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

        // Credit wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: amountAwarded },
            version: { increment: 1 },
          },
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

        // Mark redemption completed
        await tx.redemptionRequest.update({
          where: { id: redemption.id },
          data: { status: RedemptionStatus.COMPLETED, processedAt: new Date() },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'REDEEM_POINTS',
            resourceType: 'RedemptionRequest',
            resourceId: redemption.id,
            changes: {
              pointsRedeemed: dto.points,
              amountAwarded,
              walletId: wallet.id,
            },
          },
        });
      });

      const completed = await this.prisma.redemptionRequest.findUniqueOrThrow({
        where: { id: redemption.id },
      });

      logger.info(
        { userId, points: dto.points, amountAwarded, redemptionId: redemption.id },
        'Redemption completed'
      );

      return completed;
    } catch (error) {
      await this.prisma.redemptionRequest.update({
        where: { id: redemption.id },
        data: {
          status: RedemptionStatus.FAILED,
          failureReason: (error as Error).message,
        },
      });

      logger.error({ userId, redemptionId: redemption.id, error }, 'Redemption failed');
      throw error;
    }
  }

  async getRedemptionHistory(
    userId: string,
    skip = 0,
    take = 20
  ): Promise<{ data: RedemptionRequest[]; total: number }> {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.redemptionRequest.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.redemptionRequest.count({ where: { userId } }),
    ]);
    return { data, total };
  }

  async getRedemptionById(id: string, userId: string): Promise<RedemptionRequest> {
    const redemption = await this.prisma.redemptionRequest.findFirst({
      where: { id, userId },
    });
    if (!redemption) throw new NotFoundException('Redemption request not found');
    return redemption;
  }
}
