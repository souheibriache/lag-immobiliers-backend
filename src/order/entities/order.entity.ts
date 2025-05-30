import { BaseEntity } from '@app/base-entity';
import { Address } from 'src/address/entities/address.entity';
import { Product } from 'src/product/entities';
import { RequestStatusEnum } from 'src/property-request/enums/request-status.enum';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity('order')
export class Order extends BaseEntity {
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;

  @Column({ type: 'boolean', default: false, name: 'id_paid' })
  isPaid: boolean;

  @Column({
    type: 'enum',
    enum: RequestStatusEnum,
    default: RequestStatusEnum.DRAFT,
  })
  status: RequestStatusEnum;

  @Column({ nullable: true })
  orderId?: string;

  @Column({ nullable: true })
  checkoutId?: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ name: 'phone_number' })
  phoneNumber: string;

  @OneToOne(() => Address)
  @JoinColumn({ name: 'address_id', referencedColumnName: 'id' })
  address: Address;
}
