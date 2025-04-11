import { Controller, Get, Query, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('transaction')
@ApiBearerAuth()
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiOperation({ summary: 'Fetch transaction history' })
  @Get('history')
  async findAll(@Req() req, @Query() query: any) {
    const user = req.user;

    const transactions = await this.transactionService.getTransactions(
      user.sub,
      query,
    );

    return transactions;
  }
}
