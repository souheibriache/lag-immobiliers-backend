import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CategorySearchDto {
  @ApiPropertyOptional({ description: 'Recherche par nom (contains)' })
  @IsOptional()
  @IsString()
  q?: string;
}
