import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class RateResponseDto {
  @ApiProperty()
  @IsString()
  baseCurrency: string;

  @ApiProperty()
  @IsString()
  targetCurrency: string;

  @ApiProperty()
  @IsNumber()
  rate: number;
}
