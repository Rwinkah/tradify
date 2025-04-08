import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { Column } from 'typeorm';

export class FundWalletDto {
  @ApiProperty()
  @Column()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @Column()
  @IsString()
  currencyCode: string;
}
