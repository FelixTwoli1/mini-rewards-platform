import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('wallet')
@ApiBearerAuth('JWT')
@Controller({ path: 'wallet', version: '1' })
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get my wallet balance' })
  async balance(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.walletService.getBalance(user.sub) };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get my wallet transaction history' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  async history(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return { success: true, data: await this.walletService.getHistory(user.sub, skip, take) };
  }
}
