import { Controller, Get } from '@nestjs/common';
import { FxRateService } from './fxrate.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('fxrate')
@Controller('fx')
export class FxRateController {
  constructor(private readonly fxRateService: FxRateService) {}

  @Get('rates')
  async getAllFxRates() {
    return await this.fxRateService.fetchAllRates();
  }
}
