import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class CreateAccompagniementRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  accompaniementId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Length(6, 20)
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
