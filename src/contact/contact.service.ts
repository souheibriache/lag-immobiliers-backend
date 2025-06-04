// contact.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { Address } from 'src/address/entities/address.entity';
import { UpdateContactDto } from './dto/update-contact.dto';
import { WhatsappGroup } from './entities/whatsapp-group.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    @InjectRepository(WhatsappGroup)
    private readonly groupRepo: Repository<WhatsappGroup>,
    private readonly ds: DataSource,
  ) {
    this.initializeContact();
  }

  private async initializeContact() {
    const count = await this.contactRepo.count();
    if (count === 0) {
      const addr = this.addressRepo.create({});
      await this.addressRepo.save(addr);
      const c = this.contactRepo.create({ address: addr, whatsAppGroups: [] });
      await this.contactRepo.save(c);
    }
  }

  async getContact(): Promise<Contact> {
    const contact = await this.contactRepo.find({
      relations: { address: true, whatsAppGroups: true },
    });
    if (!contact.length) throw new NotFoundException('Contact not found');
    return contact[0];
  }

  async update(dto: UpdateContactDto): Promise<Contact> {
    const contact = await this.getContact();
    const { address, whatsAppGroups, ...rest } = dto;
    console.log({ dto });
    await this.contactRepo.update(contact.id, rest);

    if (address) {
      await this.addressRepo.update(contact.address.id, address);
    }

    if (whatsAppGroups) {
      await this.groupRepo.delete({ contact: { id: contact.id } });
      const groups = whatsAppGroups.map((g) =>
        this.groupRepo.create({ ...g, contact }),
      );
      await this.groupRepo.save(groups);
    }

    return await this.getContact();
  }
}
