import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ProductTypeEnum } from '../enums/product-type.enum';

export class ProductSearchDto {
  @ApiPropertyOptional({
    description: 'Search by title or description (contains)',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by featured status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    enum: ProductTypeEnum,
    description: 'Filter by product type',
  })
  @IsOptional()
  @IsEnum(ProductTypeEnum)
  type?: ProductTypeEnum;

  @ApiPropertyOptional({ description: 'Search in characteristics' })
  @IsOptional()
  @IsString()
  characteristic?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter products with discount only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasDiscount?: boolean;
}
