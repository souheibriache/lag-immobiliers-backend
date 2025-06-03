import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsString,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RequestStatusEnum } from 'src/property-request/enums/request-status.enum';
import { ProductTypeEnum } from 'src/product/enums/product-type.enum';

export class FilterOrderDto {
  @ApiPropertyOptional({ description: 'Numéro de page' })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ description: "Nombre d'éléments par page" })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(value))
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Recherche par nom, email ou ID de commande',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: RequestStatusEnum,
    description: 'Statut de la commande',
  })
  @IsOptional()
  @IsEnum(RequestStatusEnum)
  status?: RequestStatusEnum;

  @ApiPropertyOptional({
    enum: ProductTypeEnum,
    description: 'Type de produit',
  })
  @IsOptional()
  @IsEnum(ProductTypeEnum)
  productType?: ProductTypeEnum;

  @ApiPropertyOptional({ description: 'Statut de paiement' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'ID du produit' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Date de début (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Trier par',
    enum: ['createdAt', 'updatedAt', 'firstName', 'lastName'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Ordre de tri', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
