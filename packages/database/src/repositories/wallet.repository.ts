import { PrismaClient, Wallet, WalletTransaction, Prisma, TransactionType, TransactionStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class WalletRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByUserId(userId: string): Promise<Wallet | null> {
    return this.prisma.wallet.findUnique({ where: { userId } });
  }

  async createWallet(userId: string): Promise<Wallet> {
    return this.prisma.wallet.create({ data: { userId, balance: 0.0 } });
  }

  async creditWallet(
    userId: string,
    amount: number,
    reason: string,
    referenceId?: string
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    return this.executeInTransaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: { increment: amount },
          version: { increment: 1 },
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          amount,
          type: TransactionType.CREDIT,
          status: TransactionStatus.COMPLETED,
          reason,
          referenceId,
        },
      });

      return { wallet, transaction };
    });
  }

  async debitWallet(
    userId: string,
    amount: number,
    reason: string,
    referenceId?: string
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    return this.executeInTransaction(async (tx) => {
      const current = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      if (current.balance < amount) {
        throw new Error(`Insufficient wallet balance. Available: ${current.balance}, Required: ${amount}`);
      }

      const wallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: amount },
          version: { increment: 1 },
        },
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          amount,
          type: TransactionType.DEBIT,
          status: TransactionStatus.COMPLETED,
          reason,
          referenceId,
        },
      });

      return { wallet, transaction };
    });
  }

  async getTransactionHistory(
    userId: string,
    params: { skip?: number; take?: number }
  ): Promise<{ data: WalletTransaction[]; total: number }> {
    const { skip = 0, take = 20 } = params;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where: { userId } }),
    ]);
    return { data, total };
  }
}
