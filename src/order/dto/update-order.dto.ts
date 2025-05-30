// dto/update-order.dto.ts
import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { RequestStatusEnum } from 'src/property-request/enums/request-status.enum';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiPropertyOptional({ enum: RequestStatusEnum })
  @IsEnum(RequestStatusEnum)
  @IsOptional()
  status?: RequestStatusEnum;

  @ApiPropertyOptional({
    description: 'Marquer la commande comme payée ou non',
  })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;
}
