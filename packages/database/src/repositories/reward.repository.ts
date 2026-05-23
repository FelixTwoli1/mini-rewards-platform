import { PrismaClient, RewardAccount, RewardTransaction, Prisma, TransactionType } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class RewardRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findAccountByUserId(userId: string): Promise<RewardAccount | null> {
    return this.prisma.rewardAccount.findUnique({ where: { userId } });
  }

  async createAccount(userId: string): Promise<RewardAccount> {
    return this.prisma.rewardAccount.create({
      data: { userId, balance: 0 },
    });
  }

  async awardPoints(
    userId: string,
    points: number,
    reason: string,
    referenceId?: string
  ): Promise<{ account: RewardAccount; transaction: RewardTransaction }> {
    return this.executeInTransaction(async (tx) => {
      const account = await tx.rewardAccount.update({
        where: { userId },
        data: {
          balance: { increment: points },
          totalEarned: { increment: points },
          version: { increment: 1 },
        },
      });

      const transaction = await tx.rewardTransaction.create({
        data: {
          rewardAccountId: account.id,
          points,
          type: TransactionType.CREDIT,
          reason,
          referenceId,
        },
      });

      return { account, transaction };
    });
  }

  async deductPoints(
    userId: string,
    points: number,
    reason: string,
    referenceId?: string
  ): Promise<{ account: RewardAccount; transaction: RewardTransaction }> {
    return this.executeInTransaction(async (tx) => {
      const current = await tx.rewardAccount.findUniqueOrThrow({ where: { userId } });
      if (current.balance < points) {
        throw new Error(`Insufficient reward balance. Available: ${current.balance}, Required: ${points}`);
      }

      const account = await tx.rewardAccount.update({
        where: { userId },
        data: {
          balance: { decrement: points },
          totalRedeemed: { increment: points },
          version: { increment: 1 },
        },
      });

      const transaction = await tx.rewardTransaction.create({
        data: {
          rewardAccountId: account.id,
          points,
          type: TransactionType.DEBIT,
          reason,
          referenceId,
        },
      });

      return { account, transaction };
    });
  }

  async getTransactionHistory(
    userId: string,
    params: { skip?: number; take?: number }
  ): Promise<{ data: RewardTransaction[]; total: number }> {
    const { skip = 0, take = 20 } = params;
    const account = await this.prisma.rewardAccount.findUniqueOrThrow({ where: { userId } });

    const [data, total] = await this.prisma.$transaction([
      this.prisma.rewardTransaction.findMany({
        where: { rewardAccountId: account.id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rewardTransaction.count({ where: { rewardAccountId: account.id } }),
    ]);

    return { data, total };
  }
}
