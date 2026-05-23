import { Injectable } from '@nestjs/common';
import { RewardStrategy, RewardStrategyContext, RewardCalculationResult } from './reward-strategy.interface';

@Injectable()
export class PurchaseRewardStrategy implements RewardStrategy {
  private static readonly POINTS_PER_DOLLAR = 10;

  calculate(context: RewardStrategyContext): RewardCalculationResult {
    const amount = (context.metadata?.amount as number) ?? 0;
    const points = Math.floor(amount * PurchaseRewardStrategy.POINTS_PER_DOLLAR);
    return { points, reason: `PURCHASE_REWARD:$${amount}` };
  }

  supports(eventType: string): boolean {
    return eventType === 'PURCHASE_REWARD';
  }
}
