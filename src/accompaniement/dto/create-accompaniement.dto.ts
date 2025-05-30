import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  IsNumber,
  Min,
  ArrayUnique,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateAccompaniementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @ApiProperty({ isArray: true, default: [], nullable: true })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  characteristics: string[];

  @ApiProperty({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value))
  order?: number = 0;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  price: number;
}
