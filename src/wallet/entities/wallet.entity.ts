import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  VersionColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { WalletBalance } from './wallet-balance.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.wallet)
  user: User;

  @OneToMany(() => WalletBalance, (balance) => balance.wallet, {
    cascade: true,
    eager: true,
  })
  balances: WalletBalance[];

  @VersionColumn()
  version: number;
}
