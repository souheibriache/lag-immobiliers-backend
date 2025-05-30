import { BaseEntity } from '@app/base-entity';
import { Address } from 'src/address/entities/address.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { WhatsappGroup } from './whatsapp-group.entity';

@Entity('contacts')
export class Contact extends BaseEntity {
  @Column({ nullable: true, default: '' })
  facebook: string;

  @Column({ nullable: true, default: '' })
  instagram: string;
  @Column({ nullable: true, default: '' })
  youtube: string;

  @Column({ nullable: true, default: '' })
  tiktok: string;

  @Column({ nullable: true, default: '' })
  linkedin: string;

  @Column({ nullable: true, default: '' })
  twitter: string;

  @Column({ nullable: true, default: '' })
  email: string;

  @Column({ nullable: true, default: '' })
  phoneNumber: string;

  @Column({ nullable: true, default: '' })
  whatsapp: string;

  @Column({ nullable: true, default: '' })
  googleMapUrl: string;

  @OneToOne(() => Address)
  @JoinColumn({ name: 'address_id', referencedColumnName: 'id' })
  address: Address;

  @OneToMany(
    () => WhatsappGroup,
    (whatsappGroup: WhatsappGroup) => whatsappGroup.contact,
  )
  whatsAppGroups: WhatsappGroup[];
}
