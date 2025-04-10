import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WalletBalance } from '../../wallet/entities/wallet-balance.entity';

@Entity()
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @OneToMany(() => WalletBalance, (balance) => balance.currency)
  balances: WalletBalance[];
}
