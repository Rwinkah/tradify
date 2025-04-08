import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WalletBalance } from './entities/wallet-balance.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WalletBalanceService {
  constructor() {}
}
