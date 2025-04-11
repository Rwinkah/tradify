import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { Currency } from '../currency/entities/currency.entity';
import { TransactionService } from 'src/transaction/transaction.service';
import { FxRateService } from '../fxrate/fxrate.service';
import { CurrencyService } from 'src/currency/currency.service';
import { User } from 'src/users/entities/user.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { Transaction } from 'src/transaction/entities/transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    private currencyService: CurrencyService,
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
    @InjectRepository(WalletBalance)
    private walletBalanceRepository: Repository<WalletBalance>,
    private transactionService: TransactionService,
    private readonly fxRateService: FxRateService,
  ) {}

  async getParentWallet(id: string) {
    return await this.walletRepository.findOne({
      where: { id },
    });
  }

  async getAllWallets(id: number) {
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new NotFoundException('No user exists with parameter id');
    }
    const wallet = await this.walletRepository.findOne({
      where: { user: { id } },
      relations: ['user'], // Ensure that 'user' relation is loaded if it's not lazy-loaded
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found for the user');
    }
    console.log(wallet, wallet.balances);
    return wallet.balances;
  }

  async getWalletBalance(id: number, currencyCode: string) {
    const allBalances = await this.getAllWallets(id);

    if (allBalances.length < 1) {
      throw new NotFoundException('User has no balances');
    }

    const walletBalance = allBalances.find(
      (balance) => balance.currency.code === currencyCode,
    );

    if (!walletBalance) {
      throw new NotFoundException(
        `No balance found for currency: ${currencyCode}`,
      );
    }

    return walletBalance; // Return the wallet balance object for the specified currency
  }

  async deposit(id: number, currencyCode: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than zero');
    }

    await this.currencyService.validateCurrencyCode(currencyCode);

    return await this.walletBalanceRepository.manager.transaction(
      async (transactionManager: EntityManager) => {
        const walletBalance = await transactionManager
          .getRepository(WalletBalance)
          .findOne({
            where: {
              wallet: { user: { id } },
              currency: { code: currencyCode },
            },
            relations: ['wallet', 'currency'],
          });

        if (!walletBalance) {
          throw new NotFoundException(
            `No balance found for currency: ${currencyCode}`,
          );
        }

        walletBalance.amount += amount;

        await transactionManager.save(WalletBalance, walletBalance);

        const wallet = await transactionManager
          .getRepository(Wallet)
          .findOne({ where: { id: walletBalance.wallet.id } });

        if (!wallet) {
          throw new NotFoundException('Wallet not found for the user');
        }
        await this.transactionService.saveTransaction(
          wallet,
          amount,
          'DEPOSIT',
          walletBalance.currency,
          transactionManager, // Pass the transaction manager
        );

        return walletBalance;
      },
    );
  }
  async withdraw(id: number, currencyCode: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException(
        'Withdrawal amount must be greater than zero',
      );
    }

    await this.currencyService.validateCurrencyCode(currencyCode);

    return await this.walletBalanceRepository.manager.transaction(
      async (transactionManager: EntityManager) => {
        const walletBalance = await transactionManager
          .getRepository(WalletBalance)
          .findOne({
            where: {
              wallet: { user: { id } },
              currency: { code: currencyCode },
            },
            relations: ['wallet', 'currency'],
          });

        if (!walletBalance) {
          throw new NotFoundException(
            `No balance found for currency: ${currencyCode}`,
          );
        }

        if (walletBalance.amount < amount) {
          throw new BadRequestException(
            `Insufficient balance for currency: ${currencyCode}`,
          );
        }

        walletBalance.amount -= amount;

        await transactionManager.save(WalletBalance, walletBalance);

        await transactionManager.save(Transaction, {
          wallet: walletBalance.wallet,
          amount: amount,
          type: 'WITHDRAW',
          currency: walletBalance.currency,
        });

        return walletBalance;
      },
    );
  }

  async swap(
    id: number,
    fromCurrencyCode: string,
    toCurrencyCode: string,
    amount: number,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Swap amount must be greater than zero');
    }

    await this.currencyService.validateCurrencyCode(fromCurrencyCode);
    await this.currencyService.validateCurrencyCode(toCurrencyCode);

    // Fetch the exchange rate
    const conversionRate = await this.fxRateService.fetchAndCacheRate(
      fromCurrencyCode,
      toCurrencyCode,
    );

    return await this.walletBalanceRepository.manager.transaction(
      async (transactionManager: EntityManager) => {
        // Get the wallet balance for the `fromCurrency`
        const fromWalletBalance = await transactionManager
          .getRepository(WalletBalance)
          .findOne({
            where: {
              wallet: { user: { id } },
              currency: { code: fromCurrencyCode },
            },
            relations: ['wallet', 'currency'],
          });

        if (!fromWalletBalance) {
          throw new NotFoundException(
            `No balance found for currency: ${fromCurrencyCode}`,
          );
        }

        if (fromWalletBalance.amount < amount) {
          throw new BadRequestException(
            `Insufficient balance for currency: ${fromCurrencyCode}`,
          );
        }

        // Deduct the amount from the `fromCurrency` balance
        fromWalletBalance.amount -= amount;
        await transactionManager.save(WalletBalance, fromWalletBalance);

        // Get or create the wallet balance for the `toCurrency`
        let toWalletBalance = await transactionManager
          .getRepository(WalletBalance)
          .findOne({
            where: {
              wallet: { user: { id } },
              currency: { code: toCurrencyCode },
            },
            relations: ['wallet', 'currency'],
          });

        if (!toWalletBalance) {
          // Create a new wallet balance for the `toCurrency`
          const wallet = await transactionManager
            .getRepository(Wallet)
            .findOne({
              where: { user: { id } },
            });

          if (!wallet) {
            throw new NotFoundException('Wallet not found for the user');
          }

          const toCurrency = await transactionManager
            .getRepository(Currency)
            .findOne({
              where: { code: toCurrencyCode },
            });

          if (!toCurrency) {
            throw new NotFoundException(
              `Currency not found for code: ${toCurrencyCode}`,
            );
          }

          toWalletBalance = transactionManager.create(WalletBalance, {
            wallet,
            currency: toCurrency,
            amount: 0, // Initialize with 0 balance
          });

          await transactionManager.save(WalletBalance, toWalletBalance);
        }

        // Add the converted amount to the `toCurrency` balance
        const convertedAmount = amount * conversionRate;
        toWalletBalance.amount += convertedAmount;
        await transactionManager.save(WalletBalance, toWalletBalance);

        // Save the transaction
        await transactionManager.save(Transaction, {
          wallet: fromWalletBalance.wallet,
          amount: amount,
          type: 'SWAP',
          currency: fromWalletBalance.currency,
          toCurrencyCode: toCurrencyCode,
        });

        return {
          from: fromWalletBalance,
          to: toWalletBalance,
          conversionRate,
          convertedAmount,
        };
      },
    );
  }

  async trade(id: number, targetCurrencyCode: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Trade amount must be greater than zero');
    }

    await this.currencyService.validateCurrencyCode(targetCurrencyCode);

    // Fetch the exchange rate
    const conversionRate = await this.fxRateService.fetchAndCacheRate(
      'NGN',
      targetCurrencyCode,
    );

    return await this.walletBalanceRepository.manager.transaction(
      async (transactionManager: EntityManager) => {
        const ngnWalletBalance = await transactionManager
          .getRepository(WalletBalance)
          .findOne({
            where: {
              wallet: { user: { id } },
              currency: { code: 'NGN' },
            },
            relations: ['wallet', 'currency'],
          });

        if (!ngnWalletBalance) {
          throw new NotFoundException('No NGN balance found for the user');
        }

        if (ngnWalletBalance.amount < amount) {
          throw new BadRequestException(
            'Insufficient NGN balance for the trade',
          );
        }

        ngnWalletBalance.amount -= amount;
        await transactionManager.save(WalletBalance, ngnWalletBalance);

        const targetWalletBalance = await transactionManager
          .getRepository(WalletBalance)
          .findOne({
            where: {
              wallet: { user: { id } },
              currency: { code: targetCurrencyCode },
            },
            relations: ['wallet', 'currency'],
          });

        if (!targetWalletBalance) {
          throw new NotFoundException(
            `No balance found for currency: ${targetCurrencyCode}`,
          );
        }

        const convertedAmount = amount * conversionRate;
        targetWalletBalance.amount += convertedAmount;
        await transactionManager.save(WalletBalance, targetWalletBalance);

        await transactionManager.save(Transaction, {
          wallet: ngnWalletBalance.wallet,
          amount: amount,
          type: 'TRADE',
          currency: ngnWalletBalance.currency,
          toCurrencyCode: targetCurrencyCode,
        });

        return {
          from: ngnWalletBalance,
          to: targetWalletBalance,
          conversionRate,
          convertedAmount,
        };
      },
    );
  }
}
