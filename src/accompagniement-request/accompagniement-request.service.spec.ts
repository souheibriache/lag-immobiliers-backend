import { Test, TestingModule } from '@nestjs/testing';
import { AccompagniementRequestService } from './accompagniement-request.service';

describe('AccompagniementRequestService', () => {
  let service: AccompagniementRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccompagniementRequestService],
    }).compile();

    service = module.get<AccompagniementRequestService>(AccompagniementRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
