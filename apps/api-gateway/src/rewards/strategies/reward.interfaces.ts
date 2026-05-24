export interface RewardContext {
  userId: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

export interface RewardResult {
  points: number;
  reason: string;
}

export interface RewardStrategy {
  calculate(ctx: RewardContext): RewardResult;
  supports(eventType: string): boolean;
}
