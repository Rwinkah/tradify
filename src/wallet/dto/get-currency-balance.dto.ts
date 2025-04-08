import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString } from 'class-validator';

export class GetCurrencyBalanceDto {
  @ApiProperty()
  @IsString()
  currencyCode: string;
}
