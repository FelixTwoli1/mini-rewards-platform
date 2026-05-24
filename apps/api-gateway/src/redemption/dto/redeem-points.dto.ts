import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsString } from 'class-validator';

export class RedeemPointsDto {
  @ApiProperty({ example: 500, description: 'Points to redeem — minimum set by REDEMPTION_MIN_POINTS env var' })
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty({
    example: 'unique-request-id-001',
    description: 'Unique key per request — resending the same key returns the original result (idempotent)',
  })
  @IsString()
  idempotencyKey: string;
}
