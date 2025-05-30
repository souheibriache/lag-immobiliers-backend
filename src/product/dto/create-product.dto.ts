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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductTypeEnum } from '../enums/product-type.enum';

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

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  isFeatured?: boolean = false;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  characteristics: string[];

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  @IsString()
  category?: string;
}
