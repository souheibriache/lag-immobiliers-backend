import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class VerifyAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  verificationToken: string
}
