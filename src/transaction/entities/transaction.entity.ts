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
import { IsString } from 'class-validator';

@Entity('transactions')
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

  @IsString()
  @Column()
  type: string;

  @ManyToOne(() => Currency, { eager: true })
  @JoinColumn({ name: 'currency', referencedColumnName: 'code' })
  currency: Currency;

  @Column({ nullable: true })
  toCurrencyCode: string;
}
