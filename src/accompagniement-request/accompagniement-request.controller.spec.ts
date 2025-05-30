import { Test, TestingModule } from '@nestjs/testing';
import { AccompagniementRequestController } from './accompagniement-request.controller';
import { AccompagniementRequestService } from './accompagniement-request.service';

describe('AccompagniementRequestController', () => {
  let controller: AccompagniementRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccompagniementRequestController],
      providers: [AccompagniementRequestService],
    }).compile();

    controller = module.get<AccompagniementRequestController>(AccompagniementRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
