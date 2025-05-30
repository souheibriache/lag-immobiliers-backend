import { BaseEntity } from '@app/base-entity';
import { Column, Entity } from 'typeorm';

@Entity('address')
export class Address extends BaseEntity {
  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  addressLine1: string;

  @Column({ nullable: true })
  addressLine2: string;
}
