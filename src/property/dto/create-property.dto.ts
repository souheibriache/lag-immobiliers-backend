// create-property.dto.ts
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
  IsArray,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressDto } from 'src/address/dto/create-address.dto';
import { PriceDto } from './price-dto';
import { CharacteristicDto } from './characteristic.dto';

export class CreatePropertyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'URL Google Maps' })
  @IsString()
  @IsNotEmpty()
  googleMapUrl: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
  })
  isFeatured?: boolean = false;

  @ApiProperty({ type: AddressDto })
  @Transform(({ value }) => JSON.parse(value))
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ type: PriceDto })
  @ValidateNested()
  @Type(() => PriceDto)
  @Transform(({ value }) => JSON.parse(value))
  price: PriceDto;

  @ApiPropertyOptional({ type: [CharacteristicDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CharacteristicDto)
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  characteristics?: CharacteristicDto[];
}
