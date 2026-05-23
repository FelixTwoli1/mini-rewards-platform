import { RewardStrategyExecutor } from './reward-strategy.executor';
import { SignupBonusStrategy } from './signup-bonus.strategy';
import { PurchaseRewardStrategy } from './purchase-reward.strategy';
import { PromotionalCampaignStrategy } from './promotional-campaign.strategy';
import { BadRequestException } from '@nestjs/common';

describe('RewardStrategyExecutor', () => {
  let executor: RewardStrategyExecutor;

  beforeEach(() => {
    executor = new RewardStrategyExecutor(
      new SignupBonusStrategy(),
      new PurchaseRewardStrategy(),
      new PromotionalCampaignStrategy()
    );
  });

  it('should award 500 points for SIGNUP_BONUS', () => {
    const result = executor.execute('SIGNUP_BONUS', { userId: 'u-1' });
    expect(result.points).toBe(500);
    expect(result.reason).toBe('SIGNUP_BONUS');
  });

  it('should award 10 points per dollar for PURCHASE_REWARD', () => {
    const result = executor.execute('PURCHASE_REWARD', {
      userId: 'u-1',
      metadata: { amount: 10 },
    });
    expect(result.points).toBe(100);
  });

  it('should award 200 default points for PROMOTIONAL_CAMPAIGN', () => {
    const result = executor.execute('PROMOTIONAL_CAMPAIGN', { userId: 'u-1' });
    expect(result.points).toBe(200);
  });

  it('should award custom points for PROMOTIONAL_CAMPAIGN with metadata', () => {
    const result = executor.execute('PROMOTIONAL_CAMPAIGN', {
      userId: 'u-1',
      metadata: { points: 750, campaign: 'BLACK_FRIDAY' },
    });
    expect(result.points).toBe(750);
    expect(result.reason).toContain('BLACK_FRIDAY');
  });

  it('should throw BadRequestException for unknown event type', () => {
    expect(() => executor.execute('UNKNOWN_EVENT', { userId: 'u-1' })).toThrow(BadRequestException);
  });
});
