import { ApiProperty } from '@nestjs/swagger';
import { AccompagniementRequest } from '../entities/accompagniement-request.entity';

export class PaginatedAccompagnementRequestResponseDto {
  @ApiProperty({ type: [AccompagniementRequest] })
  items: AccompagniementRequest[];

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
