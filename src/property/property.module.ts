import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { Address } from 'src/address/entities/address.entity';
import { Price } from './entities/property-price.entity';
import { Media } from '@app/media/entities';
import { PropertyCharacteristic } from './entities/property-characteristic.entity';
import { UploadModule } from '@app/upload';
import { MediaModule } from '@app/media';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Property,
      Address,
      Price,
      Media,
      PropertyCharacteristic,
    ]),
    UploadModule,
    MediaModule,
  ],
  controllers: [PropertyController],
  providers: [PropertyService],
})
export class PropertyModule {}
