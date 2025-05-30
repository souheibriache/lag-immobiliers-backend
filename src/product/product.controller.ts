import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductImagesDto } from './dto/update-product-images.dto';
import { Product } from './entities/product.entity';
import { MEDIA_TYPES } from '@app/upload/constants/file.types';
import { UpdateImageOrderDto } from './dto/image-order-item.dto';
import { Media } from '@app/media/entities';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: Product })
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: MEDIA_TYPES.IMAGE }),
        ],
        fileIsRequired: false,
      }),
    )
    images?: Express.Multer.File[],
  ): Promise<Product> {
    return this.service.create(dto, images || []);
  }

  @Get()
  @ApiResponse({ status: 200, type: [Product] })
  findAll(): Promise<Product[]> {
    return this.service.find();
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: Product })
  findOneById(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.service.findOne({ id }, { images: true, category: true });
  }

  @Put(':id')
  @ApiResponse({ status: 200, type: Product })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<Product> {
    return this.service.update(id, dto);
  }

  @Put(':id/images')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, type: Product })
  updateImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductImagesDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: MEDIA_TYPES.IMAGE }),
        ],
        fileIsRequired: false,
      }),
    )
    images?: Express.Multer.File[],
  ): Promise<Product> {
    return this.service.updateImages(id, dto, images || []);
  }

  @Put(':id/images/order')
  @ApiResponse({ status: 200, type: [Media] })
  reorderImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateImageOrderDto,
  ) {
    return this.service.updateImagesOrder(id, dto);
  }

  @Delete(':id/images/:imageId')
  deleteImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.service.deleteImage(id, imageId).then(() => {});
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(id).then(() => {});
  }
}
