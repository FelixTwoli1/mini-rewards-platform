import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  createParamDecorator,
  ExecutionContext,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RedemptionService } from './redemption.service';
import { RedeemPointsDto } from './dto/redeem-points.dto';
import { JwtPayload } from '../auth-shared/jwt.strategy';

const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload =>
    ctx.switchToHttp().getRequest<{ user: JwtPayload }>().user
);

@ApiTags('redemption')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'redemption', version: '1' })
export class RedemptionController {
  constructor(private readonly redemptionService: RedemptionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Redeem reward points for wallet money' })
  @ApiResponse({ status: 201, description: 'Points redeemed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or validation error' })
  @ApiResponse({ status: 409, description: 'Duplicate idempotency key' })
  async redeem(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RedeemPointsDto
  ): Promise<unknown> {
    const result = await this.redemptionService.redeemPoints(user.sub, dto);
    return { success: true, data: result };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get my redemption history' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: number,
    @Query('take') take?: number
  ): Promise<unknown> {
    const result = await this.redemptionService.getRedemptionHistory(user.sub, skip, take);
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific redemption request' })
  @ApiResponse({ status: 200, description: 'Redemption details' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<unknown> {
    const result = await this.redemptionService.getRedemptionById(id, user.sub);
    return { success: true, data: result };
  }
}
