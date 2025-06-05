import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PropertyRequestService } from './property-request.service';
import { CreatePropertyRequestDto } from './dto/create-property-request.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { PropertyRequest } from './entities/property-request.entity';
import { UpdatePropertyRequestStatusDto } from './dto/update-property-request.dto';
import { FilterPropertyRequestDto } from './dto/filter-property-request.dto';
import { PaginatedPropertyRequestResponseDto } from './dto/paginated-property-request-response.dto';

@Controller('property-request')
@ApiTags('property-requests')
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

  @Get('filter')
  @ApiResponse({ status: 200, type: PaginatedPropertyRequestResponseDto })
  async findFiltered(
    @Query()
    filterDto: FilterPropertyRequestDto,
  ): Promise<PaginatedPropertyRequestResponseDto> {
    return this.propertyRequestService.findFiltered(filterDto);
  }

  @Get('stats')
  @ApiResponse({ status: 200 })
  getStats() {
    return this.propertyRequestService.getRequestStats();
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: PropertyRequest })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyRequestService.findOne(id);
  }

  @Put(':id/status')
  @ApiResponse({ status: 200, type: PropertyRequest })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyRequestStatusDto,
  ) {
    return this.propertyRequestService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, type: PropertyRequest })
  deleteRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertyRequestService.remove(id);
  }
}
