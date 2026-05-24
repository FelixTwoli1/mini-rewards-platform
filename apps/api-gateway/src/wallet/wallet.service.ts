import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { logger } from '../logger';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async getHistory(userId: string, skip = 0, take = 20) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const [data, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where: { userId }, skip, take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.count({ where: { userId } }),
    ]);

    return { data, total, balance: wallet.balance };
  }

  async creditWallet(userId: string, amount: number, reason: string, referenceId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: amount }, version: { increment: 1 } },
      });
      const transaction = await tx.walletTransaction.create({
        data: { walletId: wallet.id, userId, amount, type: 'CREDIT', status: 'COMPLETED', reason, referenceId },
      });
      logger.info({ userId, amount, reason }, 'Wallet credited');
      return { wallet, transaction };
    });
  }
}
