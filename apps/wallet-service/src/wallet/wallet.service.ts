import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Wallet, WalletTransaction } from '@prisma/client';
import { logger } from '@rewards/logger';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async creditWallet(
    userId: string,
    amount: number,
    reason: string,
    referenceId?: string
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId, isActive: true } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.$transaction(async (tx) => {
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
          type: 'CREDIT',
          status: 'COMPLETED',
          reason,
          referenceId,
        },
      });

      logger.info({ userId, amount, reason }, 'Wallet credited');
      return { wallet, transaction };
    });
  }

  async debitWallet(
    userId: string,
    amount: number,
    reason: string,
    referenceId?: string
  ): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.wallet.findUnique({ where: { userId } });
      if (!current) throw new NotFoundException('Wallet not found');
      if (current.balance < amount) {
        throw new Error(`Insufficient balance: ${current.balance} < ${amount}`);
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
          type: 'DEBIT',
          status: 'COMPLETED',
          reason,
          referenceId,
        },
      });

      logger.info({ userId, amount, reason }, 'Wallet debited');
      return { wallet, transaction };
    });
  }

  async getTransactionHistory(
    userId: string,
    skip = 0,
    take = 20
  ): Promise<{ data: WalletTransaction[]; total: number; balance: number }> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const [data, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where: { userId } }),
    ]);

    return { data, total, balance: wallet.balance };
  }
}
