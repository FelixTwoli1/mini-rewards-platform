import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { RewardsService } from './rewards.service';
import { AwardPointsDto } from './dto/award-points.dto';
import { JwtPayload } from '../auth-shared/jwt.strategy';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload =>
    ctx.switchToHttp().getRequest<{ user: JwtPayload }>().user
);

@ApiTags('rewards')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'rewards', version: '1' })
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get my reward balance' })
  @ApiResponse({ status: 200, description: 'Reward account balance' })
  async getMyBalance(@CurrentUser() user: JwtPayload): Promise<unknown> {
    const account = await this.rewardsService.getBalance(user.sub);
    return { success: true, data: account };
  }

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get reward balance for a user (Admin)' })
  async getBalance(@Param('userId', ParseUUIDPipe) userId: string): Promise<unknown> {
    const account = await this.rewardsService.getBalance(userId);
    return { success: true, data: account };
  }

  @Post('award')
  @ApiOperation({ summary: 'Award points to a user (Admin/System)' })
  @ApiResponse({ status: 201, description: 'Points awarded successfully' })
  async awardPoints(@Body() dto: AwardPointsDto): Promise<unknown> {
    const result = await this.rewardsService.awardPoints(dto);
    return { success: true, data: result };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get my reward transaction history' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async getMyHistory(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: number,
    @Query('take') take?: number
  ): Promise<unknown> {
    const result = await this.rewardsService.getTransactionHistory(user.sub, skip, take);
    return { success: true, data: result };
  }

  @Get('history/:userId')
  @ApiOperation({ summary: 'Get reward history for a user (Admin)' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async getUserHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number
  ): Promise<unknown> {
    const result = await this.rewardsService.getTransactionHistory(userId, skip, take);
    return { success: true, data: result };
  }
}
