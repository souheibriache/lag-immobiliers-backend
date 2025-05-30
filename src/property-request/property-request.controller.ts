import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { PropertyRequestService } from './property-request.service';
import { CreatePropertyRequestDto } from './dto/create-property-request.dto';
import { ApiResponse } from '@nestjs/swagger';
import { PropertyRequest } from './entities/property-request.entity';
import { UpdatePropertyRequestStatusDto } from './dto/update-property-request.dto';

@Controller('property-request')
export class PropertyRequestController {
  constructor(
    private readonly propertyRequestService: PropertyRequestService,
  ) {}

  @Post()
  @ApiResponse({ status: 201, type: PropertyRequest })
  create(@Body() dto: CreatePropertyRequestDto) {
    return this.propertyRequestService.create(dto);
  }

  @Get()
  @ApiResponse({ status: 200, type: [PropertyRequest] })
  findAll() {
    return this.propertyRequestService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: PropertyRequest })
  findOne(@Param('id') id: string) {
    return this.propertyRequestService.findOne(id);
  }

  @Put(':id/status')
  @ApiResponse({ status: 200, type: PropertyRequest })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyRequestStatusDto,
  ) {
    return this.propertyRequestService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, type: PropertyRequest })
  deleteRequest(@Param('id') id: string) {
    return this.propertyRequestService.remove(id);
  }
}
