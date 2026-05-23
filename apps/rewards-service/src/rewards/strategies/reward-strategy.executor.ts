import { Injectable, BadRequestException } from '@nestjs/common';
import { SignupBonusStrategy } from './signup-bonus.strategy';
import { PurchaseRewardStrategy } from './purchase-reward.strategy';
import { PromotionalCampaignStrategy } from './promotional-campaign.strategy';
import { RewardStrategy, RewardStrategyContext, RewardCalculationResult } from './reward-strategy.interface';

@Injectable()
export class RewardStrategyExecutor {
  private readonly strategies: RewardStrategy[];

  constructor(
    private readonly signupBonus: SignupBonusStrategy,
    private readonly purchaseReward: PurchaseRewardStrategy,
    private readonly promotionalCampaign: PromotionalCampaignStrategy
  ) {
    this.strategies = [signupBonus, purchaseReward, promotionalCampaign];
  }

  execute(eventType: string, context: RewardStrategyContext): RewardCalculationResult {
    const strategy = this.strategies.find((s) => s.supports(eventType));
    if (!strategy) {
      throw new BadRequestException(`No reward strategy for event type: ${eventType}`);
    }
    return strategy.calculate(context);
  }
}
