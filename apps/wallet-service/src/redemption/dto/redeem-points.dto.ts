import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, IsString, IsOptional } from 'class-validator';

export class RedeemPointsDto {
  @ApiProperty({ example: 500, description: 'Number of points to redeem (min 100)' })
  @IsInt()
  @Min(100)
  points: number;

  @ApiProperty({
    example: 'idem-key-abc123',
    description: 'Idempotency key to prevent duplicate redemptions',
  })
  @IsString()
  idempotencyKey: string;
}
