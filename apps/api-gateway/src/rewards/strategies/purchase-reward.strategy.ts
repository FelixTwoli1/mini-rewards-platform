import { Injectable } from '@nestjs/common';
import { RewardStrategy, RewardContext, RewardResult } from './reward.interfaces';

// 10 points per $1 is a business constant — still readable via env if needed
@Injectable()
export class PurchaseRewardStrategy implements RewardStrategy {
  private static readonly POINTS_PER_DOLLAR = 10;

  calculate(ctx: RewardContext): RewardResult {
    const amount = (ctx.metadata?.amount as number) ?? 0;
    const points = Math.floor(amount * PurchaseRewardStrategy.POINTS_PER_DOLLAR);
    return { points, reason: `PURCHASE_REWARD:$${amount}` };
  }

  supports(eventType: string): boolean {
    return eventType === 'PURCHASE_REWARD';
  }
}
