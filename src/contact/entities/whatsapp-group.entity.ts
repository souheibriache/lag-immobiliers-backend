import { BaseEntity } from '@app/base-entity';
import { Media } from '@app/media/entities';
import { Contact } from 'src/contact/entities/contact.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity('whatsapp-group')
export class WhatsappGroup extends BaseEntity {
  @ManyToOne(() => Contact, (contact: Contact) => contact.whatsAppGroups)
  @JoinColumn({ name: 'contact_id', referencedColumnName: 'id' })
  contact: Contact;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  url: string;
}
