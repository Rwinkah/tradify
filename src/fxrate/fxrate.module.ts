import { Module } from '@nestjs/common';
import { FxRateService } from './fxrate.service';
import { FxRateController } from './fxrate.controller';
import { RedisModule } from '../redis/redis.module';
import { HttpModule } from '@nestjs/axios';
import { RedisService } from 'src/redis/redis.service';
import { CurrencyModule } from 'src/currency/currency.module';

@Module({
  imports: [RedisModule, HttpModule, CurrencyModule], // Import Redis and Http modules
  providers: [FxRateService, RedisService],
  controllers: [FxRateController], // Add FxRateController
  exports: [FxRateService], // Export FxRateService for use in other modules
})
export class FxRateModule {}
