import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
  ValidateNested,
} from 'class-validator';
import { SupportFilterDto } from './support-filter.dto';
import { OrderOptionsDto, PageOptionsDto } from '@app/pagination/dto';
import { SupportSubjectEnum } from '../enums';
import { IsUnique } from '@app/pagination/decorators/is-unique-decorator';
import { SupportCategory } from '../enums/support-category.enum';

export class SupportOptionsDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  readonly name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toLowerCase())
  readonly email?: string;

  @ApiPropertyOptional({ enum: SupportSubjectEnum, isArray: true })
  @IsOptional()
  @IsEnum(SupportSubjectEnum, { each: true })
  @Validate(IsUnique)
  readonly subjects?: SupportSubjectEnum[];

  @ApiPropertyOptional({ enum: SupportCategory, isArray: true })
  @IsOptional()
  @IsEnum(SupportCategory, { each: true })
  @Validate(IsUnique)
  readonly category?: SupportCategory[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  readonly answeredById?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  readonly isSeen?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  readonly isAnswered?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => OrderOptionsDto)
  @ValidateNested({ each: true })
  readonly sort?: OrderOptionsDto;
}
