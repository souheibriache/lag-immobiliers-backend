import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { AccompaniementService } from './accompaniement.service';
import { CreateAccompaniementDto } from './dto/create-accompaniement.dto';
import { UpdateAccompaniementDto } from './dto/update-accompaniement.dto';
import { ReorderAccompaniementsDto } from './dto/reorder-accompagnement.dto';
import { Accompaniement } from './entities/accompaniement.entity';
import { MEDIA_TYPES } from '@app/upload/constants/file.types';
import { Media } from '@app/media/entities';

@ApiTags('accompaniements')
@Controller('accompaniements')
export class AccompaniementController {
  constructor(private readonly service: AccompaniementService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: Accompaniement })
  async create(
    @Body() dto: CreateAccompaniementDto,
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
  ): Promise<Accompaniement> {
    return this.service.create(dto, images || []);
  }

  @Get()
  @ApiResponse({ status: 200, type: [Accompaniement] })
  findAll(): Promise<Accompaniement[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: Accompaniement })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Accompaniement> {
    return this.service.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, type: Accompaniement })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    dto: UpdateAccompaniementDto,
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
  ): Promise<Accompaniement> {
    return this.service.update(id, dto, images);
  }

  @Put('images/reorder')
  @ApiResponse({ status: 200, type: [Media] })
  reorderImages(@Body() dto: ReorderAccompaniementsDto): Promise<void> {
    return this.service.reorderImages(dto);
  }

  @Put('reorder')
  @ApiResponse({ status: 200, type: [Accompaniement] })
  reorder(@Body() dto: ReorderAccompaniementsDto): Promise<Accompaniement[]> {
    return this.service.reorder(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.delete(id);
  }
}
