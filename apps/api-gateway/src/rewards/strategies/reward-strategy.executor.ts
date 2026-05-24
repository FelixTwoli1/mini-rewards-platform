import { Injectable, BadRequestException } from '@nestjs/common';
import { SignupBonusStrategy } from './signup-bonus.strategy';
import { PurchaseRewardStrategy } from './purchase-reward.strategy';
import { PromotionalCampaignStrategy } from './promotional-campaign.strategy';
import { RewardStrategy, RewardContext, RewardResult } from './reward.interfaces';

@Injectable()
export class RewardStrategyExecutor {
  private readonly strategies: RewardStrategy[];

  constructor(
    private readonly signupBonus: SignupBonusStrategy,
    private readonly purchase: PurchaseRewardStrategy,
    private readonly promo: PromotionalCampaignStrategy,
  ) {
    this.strategies = [signupBonus, purchase, promo];
  }

  execute(eventType: string, ctx: RewardContext): RewardResult {
    const strategy = this.strategies.find((s) => s.supports(eventType));
    if (!strategy) throw new BadRequestException(`Unknown reward event type: ${eventType}`);
    return strategy.calculate(ctx);
  }
}
