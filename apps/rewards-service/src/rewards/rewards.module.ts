import { Module } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { RewardStrategyExecutor } from './strategies/reward-strategy.executor';
import { SignupBonusStrategy } from './strategies/signup-bonus.strategy';
import { PurchaseRewardStrategy } from './strategies/purchase-reward.strategy';
import { PromotionalCampaignStrategy } from './strategies/promotional-campaign.strategy';

@Module({
  controllers: [RewardsController],
  providers: [
    RewardsService,
    RewardStrategyExecutor,
    SignupBonusStrategy,
    PurchaseRewardStrategy,
    PromotionalCampaignStrategy,
  ],
  exports: [RewardsService],
})
export class RewardsModule {}
