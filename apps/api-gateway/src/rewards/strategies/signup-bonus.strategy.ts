import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RewardStrategy, RewardContext, RewardResult } from './reward.interfaces';

@Injectable()
export class SignupBonusStrategy implements RewardStrategy {
  private readonly points: number;

  constructor(config: ConfigService) {
    this.points = config.getOrThrow<number>('SIGNUP_BONUS_POINTS');
  }

  calculate(_ctx: RewardContext): RewardResult {
    return { points: this.points, reason: 'SIGNUP_BONUS' };
  }

  supports(eventType: string): boolean {
    return eventType === 'SIGNUP_BONUS';
  }
}
