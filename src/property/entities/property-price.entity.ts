import { BaseEntity } from '@app/base-entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('property_price')
export class Price extends BaseEntity {
  @Column({ type: 'float', default: 0 })
  monthlyPrice: number;

  @Column({ type: 'float', default: 0 })
  chargesPrice: number;

  @Column({ type: 'float', default: 0 })
  dossierPrice: number;

  @Column({ type: 'float', default: 0 })
  ensurenceDepositPrice: number;

  @Column({ type: 'float', default: 0 })
  firstDepositPrice: number;
}
