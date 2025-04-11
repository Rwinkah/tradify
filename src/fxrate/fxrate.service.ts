import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '../redis/redis.service';
import { CurrencyService } from 'src/currency/currency.service';
import { ConfigService } from '@nestjs/config';
import { RateResponseDto } from './dto/rate-response.dto';

@Injectable()
export class FxRateService {
  private static base_URL: string;
  private static cacheDuration: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly httpService: HttpService,
    private readonly currencyService: CurrencyService,
    private readonly configService: ConfigService,
  ) {
    const fx_root_url = this.configService.get<string>('FX_ROOT_URL');
    const fx_api_key = this.configService.get<string>('FX_API_KEY');
    FxRateService.cacheDuration =
      this.configService.get<number>('FX_CACHE_DURATION') || 300; // Default to 5 minutes

    if (!fx_root_url || !fx_api_key) {
      throw new Error(
        'FX_ROOT_URL and FX_API_KEY must be defined in the environment variables',
      );
    }

    FxRateService.base_URL = `${fx_root_url}/${fx_api_key}`;
  }

  private createPairURL(baseCurrency: string, targetCurrency: string): string {
    return `${FxRateService.base_URL}/pair/${baseCurrency}/${targetCurrency}`;
  }

  async fetchAndCacheRate(
    baseCurrency: string,
    targetCurrency: string,
  ): Promise<number> {
    const cacheKey = `fxrate:${baseCurrency}:${targetCurrency}`;
    const cachedRate = await this.redisService.get(cacheKey);

    if (cachedRate) {
      const parsedRate = parseFloat(cachedRate);
      if (!isNaN(parsedRate) && parsedRate > 0) {
        return parsedRate;
      } else {
        console.warn(`Invalid cached rate for ${cacheKey}: ${cachedRate}`);
        await this.redisService.delete(cacheKey); // Delete invalid cache
      }
    }

    try {
      const url = this.createPairURL(baseCurrency, targetCurrency);
      const response = await this.httpService.get(url).toPromise();

      if (response?.status === 200 && response.data.conversion_rate) {
        const rate = response.data.conversion_rate;
        await this.redisService.set(
          cacheKey,
          rate.toString(),
          FxRateService.cacheDuration,
        );
        return rate;
      } else {
        console.warn(
          `No conversion rate found for ${baseCurrency} -> ${targetCurrency}`,
        );
        throw new NotFoundException(
          `Rate not found for ${baseCurrency} -> ${targetCurrency}`,
        );
      }
    } catch (error) {
      console.error(
        `Error fetching rate for ${baseCurrency} -> ${targetCurrency}: ${error.message}`,
      );
      throw new ServiceUnavailableException(
        `Error fetching rate for ${baseCurrency} -> ${targetCurrency}`,
      );
    }
  }

  async fetchAllRates(): Promise<RateResponseDto[]> {
    const currencies = await this.currencyService.findAll();
    let rates: RateResponseDto[] = [];

    if (currencies.length < 2) {
      throw new Error('Not enough currencies to fetch exchange rates');
    }

    const fetchRatePromises: Promise<RateResponseDto>[] = [];

    for (const baseCurrency of currencies) {
      for (const targetCurrency of currencies) {
        if (baseCurrency.code !== targetCurrency.code) {
          fetchRatePromises.push(
            this.fetchAndCacheRate(baseCurrency.code, targetCurrency.code).then(
              (rate) => ({
                baseCurrency: baseCurrency.code,
                targetCurrency: targetCurrency.code,
                rate,
              }),
            ),
          );
        }
      }
    }

    try {
      const rates = await Promise.all(fetchRatePromises);
      console.info('Successfully fetched and cached all exchange rates');
      return rates; // Return all rates to the client
    } catch (error) {
      console.error('Error fetching some exchange rates:', error.message);
      throw new ServiceUnavailableException(
        'Failed to fetch all exchange rates',
      );
    }
  }

  async onModuleInit() {
    await this.fetchAllRates();
  }
}
