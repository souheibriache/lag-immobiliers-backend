// contact.controller.ts
import { Controller, Get, Patch, Body, Put } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { Contact } from './entities/contact.entity';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly service: ContactService) {}

  @Get()
  @ApiResponse({ status: 200, type: Contact })
  getContact(): Promise<Contact> {
    return this.service.getContact();
  }

  @Put()
  @ApiResponse({ status: 200, type: Contact })
  update(@Body() dto: UpdateContactDto): Promise<Contact> {
    return this.service.update(dto);
  }
}
