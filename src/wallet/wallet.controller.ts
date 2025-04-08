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
import { GetCurrencyBalanceDto } from './dto/get-currency-balance.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { TradeDto } from './dto/trade.dto';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @ApiOperation({ summary: 'Get balance for all currencies' })
  @Get()
  getAllWallets(@Req() req) {
    const user = req.user;
    return this.walletService.getAllWallets(user);
  }

  @ApiOperation({ summary: 'Get balance for specific currency' })
  @Post(':currency')
  getCurrencyBalance(
    @Req() req,
    @Body() getCurrencyBalanceDto: GetCurrencyBalanceDto,
  ) {
    const id = req.user.id;

    return this.walletService.getWalletBalance(
      id,
      getCurrencyBalanceDto.currencyCode,
    );
  }

  @ApiOperation({ summary: 'Get balance for specific currency' })
  @Post('convert')
  convertBetweenCurrency(
    @Req() req,
    @Body() convertCurrencyDto: ConvertCurrencyDto,
  ) {
    const user = req.user;
    return this.walletService.swap(
      user.id,
      convertCurrencyDto.fromCurrencyCode,
      convertCurrencyDto.toCurrencyCode,
      convertCurrencyDto.amount,
    );
  }

  @ApiOperation({ summary: 'Fund wallet balance ' })
  @Post('fund')
  fundWalletBalance(@Req() req, @Body() fundWalletDto: FundWalletDto) {
    const user = req.user;
    return this.walletService.deposit(
      user.id,
      fundWalletDto.currencyCode,
      fundWalletDto.amount,
    );
  }

  @Post('trade')
  async trade(@Req() req, @Body() tradeDto: TradeDto) {
    const user = req.user; // Assuming the user is attached to the request object
    return this.walletService.trade(
      user.id,
      tradeDto.targetCurrencyCode,
      tradeDto.amount,
    );
  }
}
