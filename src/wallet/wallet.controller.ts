import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletCurrencyBalance } from './dto/wallet-currency-balance.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WalletConvertDto } from './dto/wallet-convert.dto';
import { WalletFundDto } from './dto/wallet-fund.dto';
import { WalletTradeDto } from './dto/wallet-trade.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @ApiOperation({ summary: 'Convert between currency pairs' })
  @Post('convert')
  async convertBetweenCurrency(
    @Req() req,
    @Body() convertCurrencyDto: WalletConvertDto,
  ) {
    const user = req.user;
    return await this.walletService.swap(
      user.sub,
      convertCurrencyDto.fromCurrencyCode,
      convertCurrencyDto.toCurrencyCode,
      convertCurrencyDto.amount,
    );
  }

  @ApiOperation({ summary: 'Fund wallet balance ' })
  @Post('fund')
  fundWalletBalance(@Req() req, @Body() fundWalletDto: WalletFundDto) {
    const user = req.user;
    console.info(fundWalletDto, 'is dat recieved');
    console.info('===============================================');
    return this.walletService.deposit(
      user.sub,
      fundWalletDto.currencyCode,
      fundWalletDto.amount,
    );
  }

  @Post('trade')
  async trade(@Req() req, @Body() tradeDto: WalletTradeDto) {
    const user = req.user; // Assuming the user is attached to the request object
    return this.walletService.trade(
      user.sub,
      tradeDto.targetCurrencyCode,
      tradeDto.amount,
    );
  }

  @ApiOperation({ summary: 'Get balance for all currencies' })
  @Get()
  getAllWallets(@Req() req) {
    const user = req.user;
    return this.walletService.getAllWallets(user.sub);
  }

  @ApiOperation({ summary: 'Get balance for specific currency' })
  @Post(':currency')
  getCurrencyBalance(
    @Req() req,
    @Body() getCurrencyBalanceDto: WalletCurrencyBalance,
  ) {
    const id = req.user.sub;

    return this.walletService.getWalletBalance(
      id,
      getCurrencyBalanceDto.currencyCode,
    );
  }
}
