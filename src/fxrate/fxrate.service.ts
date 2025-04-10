import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class FxRateService {
  private readonly FX_RATE_API_URL = 'https://v6.exchangerate-api.com/v6';
  private readonly API_KEY = 'your_api_key_here'; // Replace with your API key

  constructor(
    private readonly redisService: RedisService,
    private readonly httpService: HttpService,
  ) {}

  async getExchangeRate(
    baseCurrency: string,
    targetCurrency: string,
  ): Promise<number> {
    const cacheKey = `fxrate:${baseCurrency}:${targetCurrency}`;
    const cachedRate = await this.redisService.get(cacheKey);

    if (cachedRate) {
      return parseFloat(cachedRate); // Return the cached rate
    }

    // Fetch the rate from the ExchangeRate API
    const url = `${this.FX_RATE_API_URL}/${this.API_KEY}/pair/${baseCurrency}/${targetCurrency}`;
    const response = await this.httpService.get(url).toPromise();

    if (response?.status !== 200 || !response.data.conversion_rate) {
      throw new Error('Failed to fetch exchange rate');
    }

    const rate = response.data.conversion_rate;

    // Cache the rate in Redis for 1 minute
    await this.redisService.set(cacheKey, rate, 60);

    return rate;
  }
}
