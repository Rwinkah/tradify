import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Currency } from 'src/currency/entities/currency.entity';
import { EntityManager, Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';

type CurrencySeedData = {
  code: string;
  name: string;
};

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    const loadCurency = this.configService.get<boolean>(
      'LOAD_DEFAULT_CURRENCIES',
    );

    if (!loadCurency) {
      console.info(`==============================================`);

      console.info(
        'LOAD DEFAULT CURRENCIES=fALSE , Skipping load currency operation',
      );
      console.info(`==============================================`);

      return;
    }

    console.info(
      'LOAD DEFAULT CURRENCIES=true , Starting load currency operation',
    );
    const fullPath = path.resolve(
      process.cwd(),
      'src',
      'currency',
      'currencies.json',
    );

    try {
      const fileContent = await fs.readFile(fullPath, 'utf-8');
      let currencies: CurrencySeedData[];

      try {
        currencies = JSON.parse(fileContent);
      } catch (jsonError) {
        throw new Error(
          `Invalid JSON format in ${fullPath}: ${jsonError.message}`,
        );
      }

      await this.currencyRepository.manager.transaction(
        async (transactionManager: EntityManager) => {
          const existingCurrencies = await transactionManager.find(Currency, {
            where: currencies.map((currency) => ({ code: currency.code })),
          });
          const existingCodes = new Set(
            existingCurrencies.map((currency) => currency.code),
          );

          // Filter out currencies that already exist
          const newCurrencies = currencies.filter(
            (currency) => !existingCodes.has(currency.code),
          );

          if (newCurrencies.length > 0) {
            await transactionManager.save(Currency, newCurrencies);
            console.info(`==============================================`);
            console.info(`Inserted ${newCurrencies} new currencies.`);
            console.info(`==============================================`);
          } else {
            console.info(`==============================================`);
            console.info(`Default currencies already exist in the table`);
            console.info(`==============================================`);
          }
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to load currencies form currency/currencies.json: ${error.message}`,
      );
    }
  }

  async getCurrencyById(id: string) {
    return await this.currencyRepository.findOne({ where: { id } });
  }

  async getDefaultCurrency(): Promise<Currency> {
    const defCurrencyCode =
      this.configService.get<string>('DEF_CURRENCY') ?? 'NGN';
    const defaultCurrency = await this.getCurrencyByCode(defCurrencyCode);

    if (!defaultCurrency) {
      console.error(`==============================================`);
      console.error('Invalid Default Currency', defaultCurrency);
      console.error(`==============================================`);

      throw new InternalServerErrorException(
        `Default currency (${defCurrencyCode}) not found in the database`,
      );
    }

    return defaultCurrency;
  }

  mockOrRealData(): number {
    const mock = this.configService.get<boolean>('MOCK_BALANCE');

    if (mock) {
      const number = parseFloat(
        (Math.random() * (10000000 - 10000) + 10000).toFixed(2),
      );
      return number;
    }

    return 0;
  }

  async getCurrencyByCode(code: string) {
    return await this.currencyRepository.findOne({ where: { code } });
  }

  async validateCurrencyCode(currencyCode: string): Promise<Currency> {
    const currency = await this.getCurrencyByCode(currencyCode);

    if (!currency) {
      throw new BadRequestException(
        `Currency with code "${currencyCode}" does not exist`,
      );
    }

    return currency;
  }
}
