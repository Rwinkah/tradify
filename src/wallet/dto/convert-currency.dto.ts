import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ConvertCurrencyDto {
  @ApiProperty()
  @IsString()
  fromCurrencyCode: string;

  @ApiProperty()
  @IsString()
  toCurrencyCode: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}
