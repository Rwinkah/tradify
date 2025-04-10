import { Controller, Get } from '@nestjs/common';
import { FxRateService } from './fxrate.service';

@Controller('fx')
export class FxRateController {
  constructor(private readonly fxRateService: FxRateService) {}

  @Get('rates')
  async getAllFxRates() {
    // return this.fxRateService.get();
  }
}
