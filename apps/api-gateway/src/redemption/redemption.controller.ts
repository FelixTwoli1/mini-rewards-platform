import {
  Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RedemptionService } from './redemption.service';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('redemption')
@ApiBearerAuth('JWT')
@Controller({ path: 'redemption', version: '1' })
export class RedemptionController {
  constructor(private readonly redemptionService: RedemptionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Redeem reward points for wallet credit (idempotent)' })
  @ApiResponse({ status: 201, description: 'Points redeemed — wallet credited' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or below minimum' })
  @ApiResponse({ status: 409, description: 'Idempotency key used by another user' })
  async redeem(@CurrentUser() user: JwtPayload, @Body() dto: RedeemPointsDto) {
    return { success: true, data: await this.redemptionService.redeem(user.sub, dto) };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get my redemption history' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async history(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return { success: true, data: await this.redemptionService.getHistory(user.sub, skip, take) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific redemption request by ID' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getById(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.redemptionService.getById(id, user.sub) };
  }
}
