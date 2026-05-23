import { Injectable } from '@nestjs/common';
import { RewardStrategy, RewardStrategyContext, RewardCalculationResult } from './reward-strategy.interface';

@Injectable()
export class SignupBonusStrategy implements RewardStrategy {
  private static readonly SIGNUP_POINTS = 500;

  calculate(_context: RewardStrategyContext): RewardCalculationResult {
    return { points: SignupBonusStrategy.SIGNUP_POINTS, reason: 'SIGNUP_BONUS' };
  }

  supports(eventType: string): boolean {
    return eventType === 'SIGNUP_BONUS';
  }
}
