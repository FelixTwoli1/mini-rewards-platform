import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';

export enum RewardEventType {
  SIGNUP_BONUS = 'SIGNUP_BONUS',
  PURCHASE_REWARD = 'PURCHASE_REWARD',
  PROMOTIONAL_CAMPAIGN = 'PROMOTIONAL_CAMPAIGN',
}

export class AwardPointsDto {
  @ApiProperty({ example: 'user-uuid', description: 'Target user ID' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: RewardEventType, example: RewardEventType.PURCHASE_REWARD })
  @IsEnum(RewardEventType)
  eventType: RewardEventType;

  @ApiProperty({ example: 'ORDER-001', required: false })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiProperty({ example: { amount: 50 }, required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
