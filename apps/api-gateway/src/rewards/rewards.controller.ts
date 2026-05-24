import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { RewardsService } from './rewards.service';
import { AwardPointsDto } from './dto/award-points.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('rewards')
@ApiBearerAuth('JWT')
@Controller({ path: 'rewards', version: '1' })
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get my reward points balance' })
  async myBalance(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.rewardsService.getBalance(user.sub) };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get my reward transaction history' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async myHistory(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return { success: true, data: await this.rewardsService.getHistory(user.sub, skip, take) };
  }

  @Post('award')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Award points to a user (Admin only)' })
  @ApiResponse({ status: 201, description: 'Points awarded' })
  @ApiResponse({ status: 400, description: 'Unknown event type' })
  async awardPoints(@Body() dto: AwardPointsDto) {
    return { success: true, data: await this.rewardsService.awardPoints(dto) };
  }

  @Get('balance/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get a user's reward balance (Admin only)" })
  async userBalance(@Param('userId', ParseUUIDPipe) userId: string) {
    return { success: true, data: await this.rewardsService.getBalance(userId) };
  }

  @Get('history/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get a user's reward history (Admin only)" })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async userHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return { success: true, data: await this.rewardsService.getHistory(userId, skip, take) };
  }
}
