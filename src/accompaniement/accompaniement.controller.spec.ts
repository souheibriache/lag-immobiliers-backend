import { Test, TestingModule } from '@nestjs/testing';
import { AccompaniementController } from './accompaniement.controller';
import { AccompaniementService } from './accompaniement.service';

describe('AccompaniementController', () => {
  let controller: AccompaniementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccompaniementController],
      providers: [AccompaniementService],
    }).compile();

    controller = module.get<AccompaniementController>(AccompaniementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
