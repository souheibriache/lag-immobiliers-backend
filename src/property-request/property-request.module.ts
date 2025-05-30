import { Module } from '@nestjs/common';
import { PropertyRequestService } from './property-request.service';
import { PropertyRequestController } from './property-request.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyRequest } from './entities/property-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PropertyRequest])],
  controllers: [PropertyRequestController],
  providers: [PropertyRequestService],
})
export class PropertyRequestModule {}
