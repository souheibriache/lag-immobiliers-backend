import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Property } from 'src/property/entities/property.entity';
import { PropertyRequest } from 'src/property-request/entities/property-request.entity';
import { Accompaniement } from 'src/accompaniement/entities/accompaniement.entity';
import { AccompagniementRequest } from 'src/accompagniement-request/entities/accompagniement-request.entity';
import { Product } from 'src/product/entities/product.entity';
import { Order } from 'src/order/entities/order.entity';
import { Support } from 'src/support/entities/support.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      PropertyRequest,
      Accompaniement,
      AccompagniementRequest,
      Product,
      Order,
      Support,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
