import { Test, TestingModule } from '@nestjs/testing';
import { PropertyRequestService } from './property-request.service';

describe('PropertyRequestService', () => {
  let service: PropertyRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyRequestService],
    }).compile();

    service = module.get<PropertyRequestService>(PropertyRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
