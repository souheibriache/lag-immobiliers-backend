import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { RequestStatusEnum } from '../enums/request-status.enum';
import { PageOptionsDto } from '@app/pagination/dto';

export class FilterPropertyRequestDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Search in name, email, phone, or property title',
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

  @ApiPropertyOptional({ description: 'Filter by property ID' })
  @IsOptional()
  @IsString()
  propertyId?: string;

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
