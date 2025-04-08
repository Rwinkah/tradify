// transaction.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { Currency } from 'src/wallet/entities/currency.entity';
import { IsEnum } from 'class-validator';

@Entity('transaction')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  walletId: number;

  @ManyToOne(() => Wallet)
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @IsEnum(['swap', 'deposit', 'trade', 'fund'])
  type: string;

  @ManyToOne(() => Currency)
  @JoinColumn({ name: 'fromCurrencyCode' })
  fromCurrency: Currency;

  @Column({ nullable: true })
  toCurrencyCode: string;
}
