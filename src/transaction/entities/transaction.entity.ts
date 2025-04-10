// transaction.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { Currency } from 'src/currency/entities/currency.entity';
import { IsEnum } from 'class-validator';

@Entity('transaction')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Wallet, { eager: true })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @IsEnum(['SWAP', 'DEPOSIT', 'TRADE', 'FUND'])
  type: string;

  @ManyToOne(() => Currency, { eager: true })
  @JoinColumn({ name: 'fromCurrencyCode' })
  currency: Currency;

  @Column({ nullable: true })
  toCurrencyCode: string;
}
