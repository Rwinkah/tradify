import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { FxRateModule } from '../fxrate/fxrate.module';
import { TransactionModule } from '../transaction/transaction.module';
import { UsersModule } from 'src/users/users.module';
import { CurrencyModule } from 'src/currency/currency.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletBalance]),
    FxRateModule, // Import FxRateModule
    TransactionModule,
    forwardRef(() => UsersModule),
    CurrencyModule,
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [TypeOrmModule, WalletService],
})
export class WalletModule {}
