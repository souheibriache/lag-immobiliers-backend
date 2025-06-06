import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { RequestStatusEnum } from 'src/property-request/enums/request-status.enum';
import { PaginatedOrderResponse } from './dto/paginated-order-response.dto';
import { FilterOrderDto } from './dto/filter-order.dto';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Get('filter')
  @ApiOperation({ summary: 'Obtenir les commandes filtrées avec pagination' })
  @ApiResponse({ status: 200, type: PaginatedOrderResponse })
  async getFilteredOrders(
    @Query() filterDto: FilterOrderDto,
  ): Promise<PaginatedOrderResponse> {
    return this.service.getFilteredOrders(filterDto);
  }

  @Post()
  @ApiResponse({ status: 201, type: Order })
  async create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.service.createOrder(dto);
  }

  @Get()
  @ApiResponse({ status: 200, type: [Order] })
  async findAll(): Promise<Order[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: Order })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Order> {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiResponse({ status: 200, type: Order })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<Order> {
    return this.service.updateOrder(id, dto);
  }

  @Put(':id/status')
  @ApiResponse({ status: 200, type: Order })
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body('status') status: RequestStatusEnum,
  ): Promise<Order> {
    return this.service.updateOrderStatus(id, { status });
  }

  @Put(':id/pay')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markPaid(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.service.setProductToPaid(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.service.delete(id);
  }
}
