import { BaseEntity } from '@app/base-entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Property } from './property.entity';

@Entity('property_characteristic')
export class PropertyCharacteristic extends BaseEntity {
  @Column()
  name: string;

  @Column()
  value: string;

  @ManyToOne(() => Property, (property: Property) => property.characteristics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ referencedColumnName: 'id', name: 'property_id' })
  property: Property;
}
