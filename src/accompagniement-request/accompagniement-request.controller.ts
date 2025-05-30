import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AccompagniementRequestService } from './accompagniement-request.service';
import { CreateAccompagniementRequestDto } from './dto/create-accompagniement-request.dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccompagniementRequest } from './entities/accompagniement-request.entity';
import { UpdateAccompaniementRequestStatusDto } from './dto/update-accompagniement-request.dto';

@Controller('accompagniement-request')
@ApiTags('accompagniement-request')
export class AccompagniementRequestController {
  constructor(
    private readonly accompagniementRequestService: AccompagniementRequestService,
  ) {}

  @Post()
  @ApiResponse({ status: 201, type: AccompagniementRequest })
  create(@Body() dto: CreateAccompagniementRequestDto) {
    return this.accompagniementRequestService.create(dto);
  }

  @Get()
  @ApiResponse({ status: 200, type: [AccompagniementRequest] })
  findAll() {
    return this.accompagniementRequestService.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: AccompagniementRequest })
  findOne(@Param('id') id: string) {
    return this.accompagniementRequestService.findOne(id);
  }

  @Patch(':id/status')
  @ApiResponse({ status: 200, type: AccompagniementRequest })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAccompaniementRequestStatusDto,
  ) {
    return this.accompagniementRequestService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, type: AccompagniementRequest })
  deleteRequest(@Param('id') id: string) {
    return this.accompagniementRequestService.remove(id);
  }
}
