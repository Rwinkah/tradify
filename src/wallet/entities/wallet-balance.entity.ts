import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  VersionColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { Currency } from './currency.entity';
@Entity('walletBalances')
export class WalletBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.balances)
  wallet: Wallet;

  @ManyToOne(() => Currency, (currency) => currency.balances)
  currency: Currency;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  amount: number;

  @VersionColumn()
  version: number; // prevents double spending of a specific currency
}
