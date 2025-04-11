// transaction.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { Currency } from 'src/currency/entities/currency.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async saveTransaction(
    wallet: Wallet,
    amount: number,
    type: string,
    originCurrency: Currency,
    transactionManager: EntityManager,
    toCurrencyCode?: string,
  ) {
    if (!wallet) {
      throw new BadRequestException('Transaction from null wallet');
    }

    const transaction = new Transaction();
    transaction.wallet = wallet;
    transaction.currency = originCurrency;
    transaction.amount = amount;
    transaction.type = type;
    transaction.toCurrencyCode = toCurrencyCode ?? '';

    // Save the transaction to the database
    return await transactionManager.save(Transaction, transaction);
  }

  async getTransactions(userId: number, queryParams: any) {
    const {
      type,
      startDate,
      endDate,
      limit = 10, // Default limit
      offset = 0, // Default offset
    } = queryParams;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transactions')
      .innerJoinAndSelect('transactions.wallet', 'wallets') // Join the Wallet table
      .innerJoin('wallets.user', 'users') // Explicitly join the User table
      .where('users.id = :userId', { userId });

    // Apply filters only if the query parameters are provided
    if (type) {
      queryBuilder.andWhere('transactions.type = :type', { type });
    }

    if (startDate) {
      queryBuilder.andWhere('transactions.timestamp >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      queryBuilder.andWhere('transactions.timestamp <= :endDate', { endDate });
    }

    // Apply pagination and ordering
    queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('transactions.timestamp', 'DESC');

    return await queryBuilder.getMany();
  }
}
