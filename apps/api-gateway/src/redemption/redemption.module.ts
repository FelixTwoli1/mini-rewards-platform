import { Module } from '@nestjs/common';
import { RedemptionService } from './redemption.service';
import { RedemptionController } from './redemption.controller';

@Module({ controllers: [RedemptionController], providers: [RedemptionService], exports: [RedemptionService] })
export class RedemptionModule {}
