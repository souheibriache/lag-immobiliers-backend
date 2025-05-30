// property-price.dto.ts
import { IsNumber, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PriceDto {
  @ApiPropertyOptional({ description: 'Loyers mensuels' })
  @IsOptional()
  @IsNumber()
  monthlyPrice?: number;

  @ApiPropertyOptional({ description: 'Charges' })
  @IsOptional()
  @IsNumber()
  chargesPrice?: number;

  @ApiPropertyOptional({ description: 'Frais de dossier' })
  @IsOptional()
  @IsNumber()
  dossierPrice?: number;

  @ApiPropertyOptional({ description: 'Dépôt de garantie' })
  @IsOptional()
  @IsNumber()
  ensurenceDepositPrice?: number;

  @ApiPropertyOptional({ description: 'Premier dépôt' })
  @IsOptional()
  @IsNumber()
  firstDepositPrice?: number;
}
