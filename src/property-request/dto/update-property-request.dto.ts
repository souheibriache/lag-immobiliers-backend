import { ApiProperty } from '@nestjs/swagger';
import { RequestStatusEnum } from '../enums/request-status.enum';
import { IsEnum } from 'class-validator';

export class UpdatePropertyRequestStatusDto {
  @ApiProperty({ enum: RequestStatusEnum })
  @IsEnum(RequestStatusEnum)
  status: RequestStatusEnum;
}
