import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class TradeDto {
  @ApiProperty({ description: 'The target currency code for the trade' })
  @IsString()
  targetCurrencyCode: string;

  @ApiProperty({ description: 'The amount to trade from NGN' })
  @IsNumber()
  amount: number;
}
