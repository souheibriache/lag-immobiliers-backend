import { Module } from '@nestjs/common';
import { AccompagniementRequestService } from './accompagniement-request.service';
import { AccompagniementRequestController } from './accompagniement-request.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccompagniementRequest } from './entities/accompagniement-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccompagniementRequest])],
  controllers: [AccompagniementRequestController],
  providers: [AccompagniementRequestService],
})
export class AccompagniementRequestModule {}
