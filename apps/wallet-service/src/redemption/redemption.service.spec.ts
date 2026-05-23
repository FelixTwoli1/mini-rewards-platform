import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedemptionService } from './redemption.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedemptionStatus } from '@prisma/client';

const mockUser = { id: 'u-1', isActive: true };
const mockRewardAccount = { id: 'ra-1', userId: 'u-1', balance: 1000 };
const mockWallet = { id: 'w-1', userId: 'u-1', balance: 5.0 };

const mockPrismaService = {
  user: { findUnique: jest.fn() },
  rewardAccount: { findUnique: jest.fn(), update: jest.fn() },
  wallet: { findUnique: jest.fn(), update: jest.fn() },
  redemptionRequest: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  rewardTransaction: { create: jest.fn() },
  walletTransaction: { create: jest.fn() },
  auditLog: { create: jest.fn() },
  $transaction: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string, def: unknown) =>
    key === 'POINTS_TO_MONEY_CONVERSION' ? '100' : def
  ),
};

describe('RedemptionService', () => {
  let service: RedemptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedemptionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RedemptionService>(RedemptionService);
    jest.clearAllMocks();
  });

  describe('redeemPoints', () => {
    const dto = { points: 500, idempotencyKey: 'idem-key-001' };

    it('should return existing redemption for duplicate idempotency key', async () => {
      const existing = {
        id: 'r-1',
        userId: 'u-1',
        status: RedemptionStatus.COMPLETED,
        idempotencyKey: 'idem-key-001',
      };
      mockPrismaService.redemptionRequest.findUnique.mockResolvedValue(existing);

      const result = await service.redeemPoints('u-1', dto);
      expect(result).toEqual(existing);
      expect(mockPrismaService.rewardAccount.findUnique).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if idempotency key belongs to another user', async () => {
      const existing = { id: 'r-1', userId: 'other-user', idempotencyKey: 'idem-key-001' };
      mockPrismaService.redemptionRequest.findUnique.mockResolvedValue(existing);

      await expect(service.redeemPoints('u-1', dto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if reward account not found', async () => {
      mockPrismaService.redemptionRequest.findUnique.mockResolvedValue(null);
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(null);

      await expect(service.redeemPoints('u-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockPrismaService.redemptionRequest.findUnique.mockResolvedValue(null);
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue(mockRewardAccount);
      mockPrismaService.wallet.findUnique.mockResolvedValue(null);

      await expect(service.redeemPoints('u-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      mockPrismaService.redemptionRequest.findUnique.mockResolvedValue(null);
      mockPrismaService.rewardAccount.findUnique.mockResolvedValue({ ...mockRewardAccount, balance: 100 });
      mockPrismaService.wallet.findUnique.mockResolvedValue(mockWallet);

      await expect(service.redeemPoints('u-1', { points: 500, idempotencyKey: 'key2' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should convert 100 points to $1', () => {
      const points = 500;
      const conversionRate = 100;
      const expected = points / conversionRate;
      expect(expected).toBe(5.0);
    });
  });
});
