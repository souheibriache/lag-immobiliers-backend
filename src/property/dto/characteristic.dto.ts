import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CharacteristicDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  value: string;
}
