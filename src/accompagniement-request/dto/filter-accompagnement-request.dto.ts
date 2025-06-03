import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RequestStatusEnum } from 'src/property-request/enums/request-status.enum';

export class FilterAccompagnementRequestDto {
  @ApiPropertyOptional({ description: 'Page number (starts from 1)' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number.parseInt(value, 10))
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search in name, email, phone, or accompagnement title',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: RequestStatusEnum,
    description: 'Filter by request status',
  })
  @IsOptional()
  @IsEnum(RequestStatusEnum)
  status?: RequestStatusEnum;

  @ApiPropertyOptional({ description: 'Filter by accompagnement ID' })
  @IsOptional()
  @IsString()
  accompagnementId?: string;

  @ApiPropertyOptional({
    description: 'Filter requests from this date (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter requests to this date (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
