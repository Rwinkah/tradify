import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletBalance } from './entities/wallet-balance.entity';
import { Currency } from './entities/currency.entity';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class WalletService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
    @InjectRepository(WalletBalance)
    private walletBalanceRepository: Repository<WalletBalance>,
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
    private transactionService: TransactionService,
  ) {}

  private async validateCurrencyCode(currencyCode: string): Promise<Currency> {
    const currency = await this.currencyRepository.findOne({
      where: { code: currencyCode },
    });

    if (!currency) {
      throw new BadRequestException(
        `Currency with code "${currencyCode}" does not exist`,
      );
    }

    return currency;
  }

  async getCurrencyById(id: string) {
    return await this.currencyRepository.findOne({ where: { id } });
  }

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

    await this.validateCurrencyCode(currencyCode);

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
          'deposit',
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

    await this.validateCurrencyCode(currencyCode);

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

    await this.validateCurrencyCode(fromCurrencyCode);
    await this.validateCurrencyCode(toCurrencyCode);

    const conversionRate = 0.5; // Fixed conversion rate

    return await this.walletBalanceRepository.manager.transaction(
      async (transactionManager: EntityManager) => {
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

        fromWalletBalance.amount -= amount;
        await transactionManager.save(WalletBalance, fromWalletBalance);

        // Deposit into the target currency
        const toWalletBalance = await transactionManager
          .getRepository(WalletBalance)
          .findOne({
            where: {
              wallet: { user: { id } },
              currency: { code: toCurrencyCode },
            },
            relations: ['wallet', 'currency'],
          });

        if (!toWalletBalance) {
          throw new NotFoundException(
            `No balance found for currency: ${toCurrencyCode}`,
          );
        }

        const convertedAmount = amount * conversionRate;
        toWalletBalance.amount += convertedAmount;
        await transactionManager.save(WalletBalance, toWalletBalance);

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

    // Validate the target currency code
    await this.validateCurrencyCode(targetCurrencyCode);

    const conversionRate = 0.5; // Fixed conversion rate for NGN to target currency

    return await this.walletBalanceRepository.manager.transaction(
      async (transactionManager: EntityManager) => {
        // Find the NGN wallet balance
        const ngnWalletBalance = await transactionManager
          .getRepository(WalletBalance)
          .findOne({
            where: {
              wallet: { user: { id } },
              currency: { code: 'NGN' }, // NGN is the source currency
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

        // Deduct the trade amount from the NGN balance
        ngnWalletBalance.amount -= amount;
        await transactionManager.save(WalletBalance, ngnWalletBalance);

        // Find the target currency wallet balance
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

        // Convert the amount and add it to the target currency balance
        const convertedAmount = amount * conversionRate;
        targetWalletBalance.amount += convertedAmount;
        await transactionManager.save(WalletBalance, targetWalletBalance);

        // Save the trade transaction
        const wallet = await transactionManager
          .getRepository(Wallet)
          .findOne({ where: { id: ngnWalletBalance.wallet.id } });

        if (!wallet) {
          throw new NotFoundException('Wallet not found for the user');
        }

        await this.transactionService.saveTransaction(
          wallet,
          amount,
          'trade',
          ngnWalletBalance.currency,
          transactionManager,
          targetCurrencyCode,
        );

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
