import { Controller, Get, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('transaction')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiOperation({ summary: 'Fetch transaction history' })
  @Get('history')
  async findAll(@Query() query: any) {
    return this.transactionService.getTransactions(query);
  }
}
