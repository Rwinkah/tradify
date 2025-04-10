import { Test, TestingModule } from '@nestjs/testing';
import { FxRateService } from './fxrate.service';

describe('FxrateService', () => {
  let service: FxRateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FxRateService],
    }).compile();

    service = module.get<FxRateService>(FxRateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
