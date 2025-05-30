import { ApiProperty } from '@nestjs/swagger';
import { RequestStatusEnum } from 'src/property-request/enums/request-status.enum';
import { IsEnum } from 'class-validator';

export class UpdateAccompaniementRequestStatusDto {
  @ApiProperty({ enum: RequestStatusEnum })
  @IsEnum(RequestStatusEnum)
  status: RequestStatusEnum;
}
