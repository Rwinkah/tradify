import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  VersionColumn,
  JoinColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { Currency } from '../../currency/entities/currency.entity';
@Entity('walletbalances')
export class WalletBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.balances)
  wallet: Wallet;

  @ManyToOne(() => Currency, (currency) => currency.balances, { eager: true })
  @JoinColumn({ name: 'currencyCode' })
  currency: Currency;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  amount: number;

  @VersionColumn()
  version: number; // prevents double spending of a specific currency
}
