export interface RewardStrategyContext {
  userId: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

export interface RewardCalculationResult {
  points: number;
  reason: string;
}

export interface RewardStrategy {
  calculate(context: RewardStrategyContext): RewardCalculationResult;
  supports(eventType: string): boolean;
}
