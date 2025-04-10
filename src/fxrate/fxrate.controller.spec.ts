import { Test, TestingModule } from '@nestjs/testing';
import { FxrateController } from './fxrate.controller';

describe('FxrateController', () => {
  let controller: FxrateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FxrateController],
    }).compile();

    controller = module.get<FxrateController>(FxrateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
