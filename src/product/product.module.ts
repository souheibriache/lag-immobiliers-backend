import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category, Product } from './entities';
import { UploadModule } from '@app/upload';
import { Media } from '@app/media/entities';
import { MediaModule } from '@app/media';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Media, Category]),
    UploadModule,
    MediaModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
