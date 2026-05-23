import {
  Controller,
  Get,
  Query,
  UseGuards,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { JwtPayload } from '../auth-shared/jwt.strategy';

const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload =>
    ctx.switchToHttp().getRequest<{ user: JwtPayload }>().user
);

@ApiTags('wallet')
@ApiBearerAuth('JWT')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'wallet', version: '1' })
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get my wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  async getBalance(@CurrentUser() user: JwtPayload): Promise<unknown> {
    const wallet = await this.walletService.getBalance(user.sub);
    return { success: true, data: wallet };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get my wallet transaction history' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: number,
    @Query('take') take?: number
  ): Promise<unknown> {
    const result = await this.walletService.getTransactionHistory(user.sub, skip, take);
    return { success: true, data: result };
  }
}
