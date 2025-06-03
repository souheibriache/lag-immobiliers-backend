// dto/create-product.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsEnum,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductTypeEnum } from '../enums/product-type.enum';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ format: 'url' })
  @IsUrl()
  link: string;

  @ApiProperty({ enum: ProductTypeEnum, default: ProductTypeEnum.PRODUCT })
  @IsEnum(ProductTypeEnum)
  type: ProductTypeEnum;

  @ApiProperty()
  @Transform(({ value }) => Number.parseFloat(value))
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => Number.parseFloat(value))
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
  })
  isFeatured?: boolean = false;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Transform(({ value }) => JSON.parse(value))
  @IsString({ each: true })
  characteristics: string[];

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value.toUpperCase())
  @IsString()
  category?: string;
}
