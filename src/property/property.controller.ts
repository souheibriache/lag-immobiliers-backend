import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseUUIDPipe,
  Put,
  HttpCode,
  Query,
} from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Property } from './entities/property.entity';
import { MEDIA_TYPES } from '@app/upload/constants/file.types';
import { ReorderImagesDto } from './dto/update-image-order.dto';
import { Media } from '@app/media/entities';
import { PaginatedResponseDto } from '@app/pagination/dto/paginated-response.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';

@Controller('property')
@ApiTags('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: Property })
  async create(
    @Body() dto: CreatePropertyDto,
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
  ): Promise<Property> {
    return this.propertyService.create(dto, images);
  }

  @Get()
  @ApiResponse({ status: 200, type: [Property] })
  findAll(): Promise<Property[]> {
    return this.propertyService.findAll();
  }

  @Get('filter')
  @ApiResponse({ status: 200, type: PaginatedResponseDto })
  async findFiltered(
    @Query() filterDto: FilterPropertyDto,
  ): Promise<PaginatedResponseDto<Property>> {
    return this.propertyService.findFiltered(filterDto);
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: Property })
  findOneById(@Param('id', ParseUUIDPipe) id: string): Promise<Property> {
    return this.propertyService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, type: Property })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
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
  ): Promise<Property> {
    return this.propertyService.update(id, dto, images);
  }

  @Put('images/reorder')
  @ApiResponse({ status: 200, type: [Media] })
  reorderImages(@Body() dto: ReorderImagesDto): Promise<Media[]> {
    return this.propertyService.reorder(dto);
  }

  @Delete('/:propertyId/images/:imageId')
  async deleteImage(
    @Param('propertyId') propertyId: string,
    @Param('imageId') imageId: string,
  ) {
    return await this.propertyService.removeImage(propertyId, imageId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.propertyService.remove(id).then(() => {});
  }
}
