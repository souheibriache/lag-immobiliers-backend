import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Address } from 'src/address/entities/address.entity';
import { WhatsappGroup } from 'src/contact/entities/whatsapp-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Address, WhatsappGroup])],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
