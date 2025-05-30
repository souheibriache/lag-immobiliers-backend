import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';
import { AddressDto } from 'src/address/dto/create-address.dto';
import { CreateWhatsappGroupDto } from 'src/contact/dto/create-whatsapp-group.dto';

export class CreateContactDto {
  @ApiProperty()
  @IsString()
  facebook: string;

  @ApiProperty()
  @IsString()
  instagram: string;
  @ApiProperty()
  @IsString()
  youtube: string;

  @ApiProperty()
  @IsString()
  tiktok: string;

  @ApiProperty()
  @IsString()
  linkedin: string;

  @ApiProperty()
  @IsString()
  twitter: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  whatsapp: string;

  @ApiProperty()
  @IsString()
  googleMapUrl: string;

  @ApiProperty()
  // @ValidateNested({ each: true })
  address: AddressDto;

  @ApiProperty({
    isArray: true,
    type: CreateWhatsappGroupDto,
    description: 'Liste des groupes WhatsApp',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWhatsappGroupDto)
  whatsAppGroups: CreateWhatsappGroupDto[];
}
