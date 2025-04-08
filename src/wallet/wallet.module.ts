import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './entities/wallet.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { Currency } from './entities/currency.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { TransactionService } from 'src/transaction/transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletBalance, Currency]),
    UsersModule,
    TransactionModule,
  ],
  controllers: [WalletController],
  providers: [WalletService, UsersService, TransactionService],
  exports: [TypeOrmModule, WalletService],
})
export class WalletModule {}
