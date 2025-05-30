import { Property } from 'src/property/entities/property.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { RequestStatusEnum } from '../enums/request-status.enum';
import { BaseEntity } from '@app/base-entity';

@Entity('property_request')
export class PropertyRequest extends BaseEntity {
  @ManyToOne(() => Property, (property: Property) => property.requests, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'property_id', referencedColumnName: 'id' })
  property: Property;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @Column()
  message: string;

  @Column({
    type: 'enum',
    enum: RequestStatusEnum,
    default: RequestStatusEnum.PENDING,
  })
  status: RequestStatusEnum;
}
