// dto/create-property-request.dto.ts
import { IsUUID, IsString, IsEmail, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePropertyRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  propertyId: string;

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
