import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional() @IsString() @MinLength(2)
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional() @IsString() @MinLength(2)
  lastName?: string;

  @ApiProperty({ example: '+254712345678', required: false })
  @IsOptional() @IsString()
  phone?: string;
}
