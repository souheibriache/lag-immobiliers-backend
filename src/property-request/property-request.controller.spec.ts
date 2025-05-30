import { Test, TestingModule } from '@nestjs/testing';
import { PropertyRequestController } from './property-request.controller';
import { PropertyRequestService } from './property-request.service';

describe('PropertyRequestController', () => {
  let controller: PropertyRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyRequestController],
      providers: [PropertyRequestService],
    }).compile();

    controller = module.get<PropertyRequestController>(PropertyRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
