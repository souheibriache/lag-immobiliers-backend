import { Test, TestingModule } from '@nestjs/testing';
import { AccompaniementService } from './accompaniement.service';

describe('AccompaniementService', () => {
  let service: AccompaniementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccompaniementService],
    }).compile();

    service = module.get<AccompaniementService>(AccompaniementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
