import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString } from 'class-validator';

export class WalletConvertDto {
  @ApiProperty()
  @IsString()
  fromCurrencyCode: string;

  @ApiProperty()
  @IsString()
  toCurrencyCode: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;
}
