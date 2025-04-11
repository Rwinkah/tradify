import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { WalletService } from 'src/wallet/wallet.service';
import { WalletBalance } from 'src/wallet/entities/wallet-balance.entity';
import { Currency } from 'src/currency/entities/currency.entity';
import { CurrencyService } from 'src/currency/currency.service';
import { ConfigService } from '@nestjs/config';
import { Transaction } from 'src/transaction/entities/transaction.entity';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    private configService: ConfigService,
    private readonly currencyService: CurrencyService,
    private eventEmitter: EventEmitter2,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private walletService: WalletService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    // Connect the query runner to the database
    await queryRunner.connect();

    // Start a transaction
    await queryRunner.startTransaction();

    try {
      // Create the user
      const newUser = queryRunner.manager.create(User, createUserDto);
      const savedUser = await queryRunner.manager.save(User, newUser);

      // Fetch the default currency using the CurrencyService
      const defCurrencyCode =
        this.configService.get<string>('DEF_CURRENCY') ?? 'NGN';
      const defaultCurrency = await queryRunner.manager.findOne(Currency, {
        where: { code: defCurrencyCode },
      });

      if (!defaultCurrency) {
        throw new InternalServerErrorException(
          `Default currency (${defCurrencyCode}) not found in the database`,
        );
      }

      // Create the wallet
      const newWallet = queryRunner.manager.create(Wallet, { user: savedUser });
      const savedWallet = await queryRunner.manager.save(Wallet, newWallet);

      // Create the wallet balance for the default currency
      const initialAmount = this.currencyService.mockOrRealData();
      const newWalletBalance = queryRunner.manager.create(WalletBalance, {
        wallet: savedWallet,
        currency: defaultCurrency,
        amount: initialAmount,
      });
      await queryRunner.manager.save(WalletBalance, newWalletBalance);

      // Create wallet balances for all other currencies
      const currencies = await queryRunner.manager.find(Currency);
      const walletBalances = currencies
        .filter((currency) => currency.code !== defCurrencyCode) // Exclude the default currency
        .map((currency) =>
          queryRunner.manager.create(WalletBalance, {
            wallet: savedWallet,
            currency,
            amount: 0, // Initialize with 0 balance
          }),
        );

      await queryRunner.manager.save(WalletBalance, walletBalances);

      // Create a transaction for the default currency
      const newTransaction = queryRunner.manager.create(Transaction, {
        wallet: savedWallet,
        currency: defaultCurrency,
        amount: initialAmount,
        type: 'DEPOSIT',
      });
      await queryRunner.manager.save(Transaction, newTransaction);

      // Commit the transaction
      await queryRunner.commitTransaction();

      return plainToInstance(UserResponseDto, savedUser);
    } catch (error) {
      // Rollback the transaction in case of an error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  async findOneByEmail(email: string) {
    return await this.usersRepository.findOneBy({ email });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException('Can not update a user that does not exist');
    }

    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async validateEmail(email: string) {
    const user = await this.findOneByEmail(email);
    if (!user) {
      throw new BadRequestException(
        'User with the provided email does not exist',
      );
    }

    user.isVerified = true;
    return this.usersRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);

    if (!user) {
      throw new NotFoundException('Can not update a user that does not exist');
    }
    return await this.usersRepository.remove(user);
  }
}
