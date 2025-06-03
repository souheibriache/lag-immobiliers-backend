import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../entities/order.entity';

export class PaginatedOrderResponse {
  @ApiProperty({ type: [Order] })
  items: Order[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}
