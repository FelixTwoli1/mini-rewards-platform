import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { PrismaService } from '../prisma/prisma.service';
import { RewardStrategyExecutor } from './strategies/reward-strategy.executor';
import { SignupBonusStrategy } from './strategies/signup-bonus.strategy';
import { PurchaseRewardStrategy } from './strategies/purchase-reward.strategy';
import { PromotionalCampaignStrategy } from './strategies/promotional-campaign.strategy';
import { RewardEventType } from './dto/award-points.dto';

const mockPrismaService = {
  user: { findUnique: jest.fn() },
  rewardAccount: { findUnique: jest.fn(), upsert: jest.fn() },
  rewardTransaction: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  $transaction: jest.fn(),
};

describe('RewardsService', () => {
  let service: RewardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        { provide: PrismaService, useValue: mockPrismaService },
        RewardStrategyExecutor,
        SignupBonusStrategy,
        PurchaseRewardStrategy,
        PromotionalCampaignStrategy,
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return reward account when found', async () => {
      const account = { id: 'ra-1', userId: 'u-1', balance: 1000 };
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(account);

      const result = await service.getBalance('u-1');
      expect(result).toEqual(account);
    });

    it('should throw NotFoundException when account not found', async () => {
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);
      await expect(service.getBalance('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('awardPoints', () => {
    it('should throw NotFoundException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.awardPoints({ userId: 'bad', eventType: RewardEventType.SIGNUP_BONUS })
      ).rejects.toThrow(NotFoundException);
    });

    it('should award 500 signup bonus points', async () => {
      const user = { id: 'u-1', isActive: true };
      const account = { id: 'ra-1', userId: 'u-1', balance: 500, totalEarned: 500 };
      const transaction = { id: 'tx-1', points: 500 };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.rewardAccount.upsert.mockResolvedValue(account);
      mockPrismaService.rewardTransaction.create.mockResolvedValue(transaction);

      const result = await service.awardPoints({
        userId: 'u-1',
        eventType: RewardEventType.SIGNUP_BONUS,
      });

      expect(result.pointsAwarded).toBe(500);
      expect(result.account).toEqual(account);
    });

    it('should calculate purchase reward as 10 pts per dollar', async () => {
      const user = { id: 'u-1', isActive: true };
      const account = { id: 'ra-1', userId: 'u-1', balance: 500, totalEarned: 500 };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.rewardAccount.upsert.mockResolvedValue(account);
      mockPrismaService.rewardTransaction.create.mockResolvedValue({});

      const result = await service.awardPoints({
        userId: 'u-1',
        eventType: RewardEventType.PURCHASE_REWARD,
        metadata: { amount: 25 },
      });

      expect(result.pointsAwarded).toBe(250);
    });
  });
});
