import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateProductImagesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  retainedImageIds: string[];
}
