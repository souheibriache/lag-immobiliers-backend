import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ImageOrderItem {
  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  order: number;
}

export class UpdateImageOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageOrderItem)
  images: ImageOrderItem[];
}
