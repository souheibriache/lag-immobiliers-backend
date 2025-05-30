// dto/image-order.dto.ts
import { IsUUID, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ImageOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  order: number;
}

export class ReorderImagesDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  propertyId: string;

  @ApiProperty({ type: [ImageOrderDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageOrderDto)
  imagesOrder: ImageOrderDto[];
}
