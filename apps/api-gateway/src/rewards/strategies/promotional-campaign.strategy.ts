import { Injectable } from '@nestjs/common';
import { RewardStrategy, RewardContext, RewardResult } from './reward.interfaces';

@Injectable()
export class PromotionalCampaignStrategy implements RewardStrategy {
  private static readonly DEFAULT_PROMO_POINTS = 200;

  calculate(ctx: RewardContext): RewardResult {
    const points = (ctx.metadata?.points as number) ?? PromotionalCampaignStrategy.DEFAULT_PROMO_POINTS;
    const campaign = (ctx.metadata?.campaign as string) ?? 'GENERAL';
    return { points, reason: `PROMOTIONAL_CAMPAIGN:${campaign}` };
  }

  supports(eventType: string): boolean {
    return eventType === 'PROMOTIONAL_CAMPAIGN';
  }
}
