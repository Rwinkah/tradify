import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class WalletCurrencyBalance {
  @ApiProperty()
  @IsString()
  currencyCode: string;
}
