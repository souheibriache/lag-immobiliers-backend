import { ApiProperty } from '@nestjs/swagger';
import { PropertyRequest } from '../entities/property-request.entity';

export class PaginatedPropertyRequestResponseDto {
  @ApiProperty({ type: [PropertyRequest] })
  items: PropertyRequest[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}
