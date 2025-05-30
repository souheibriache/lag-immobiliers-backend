import { BaseEntity } from '@app/base-entity';
import { Column, Entity } from 'typeorm';

@Entity('whatsapp-group')
export class CreateWhatsappGroupDto extends BaseEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  url: string;
}
