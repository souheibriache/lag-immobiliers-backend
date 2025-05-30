import { BaseEntity } from '@app/base-entity';
import { Address } from 'src/address/entities/address.entity';
import { PropertyRequest } from 'src/property-request/entities/property-request.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Price } from './property-price.entity';
import { PropertyCharacteristic } from './property-characteristic.entity';
import { Media } from '@app/media/entities';

@Entity('property')
export class Property extends BaseEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  googleMapUrl: string;

  @ManyToMany(() => Media, { cascade: true })
  @JoinTable({ name: 'property_images' })
  images: Media[];

  @Column({ type: 'boolean' })
  isFeatured: boolean;

  @OneToOne(() => Address)
  @JoinColumn({ name: 'address_id', referencedColumnName: 'id' })
  address: Address;

  @OneToMany(
    () => PropertyRequest,
    (request: PropertyRequest) => request.property,
    { nullable: true },
  )
  requests: PropertyRequest[];

  @OneToOne(() => Price)
  @JoinColumn({ name: 'price_id', referencedColumnName: 'id' })
  price: Price;

  @OneToMany(
    () => PropertyCharacteristic,
    (characteristic: PropertyCharacteristic) => characteristic.property,
  )
  characteristics: PropertyCharacteristic[];
}
