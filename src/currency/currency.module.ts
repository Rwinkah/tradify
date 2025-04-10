import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from 'src/currency/entities/currency.entity';
import { CurrencyService } from './currency.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Currency])],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
