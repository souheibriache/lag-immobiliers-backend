import { PartialType } from '@nestjs/swagger';
import { AddressDto } from './create-address.dto';

export class UpdateAddressDto extends PartialType(AddressDto) {}
