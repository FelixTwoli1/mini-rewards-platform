import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'demo@rewardsplatform.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Customer@123456' })
  @IsString()
  password: string;
}
