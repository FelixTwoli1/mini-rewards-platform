import { Injectable } from '@nestjs/common';
import { RewardStrategy, RewardStrategyContext, RewardCalculationResult } from './reward-strategy.interface';

@Injectable()
export class PromotionalCampaignStrategy implements RewardStrategy {
  private static readonly DEFAULT_PROMO_POINTS = 200;

  calculate(context: RewardStrategyContext): RewardCalculationResult {
    const points = (context.metadata?.points as number) ?? PromotionalCampaignStrategy.DEFAULT_PROMO_POINTS;
    const campaign = (context.metadata?.campaign as string) ?? 'GENERAL';
    return { points, reason: `PROMOTIONAL_CAMPAIGN:${campaign}` };
  }

  supports(eventType: string): boolean {
    return eventType === 'PROMOTIONAL_CAMPAIGN';
  }
}
