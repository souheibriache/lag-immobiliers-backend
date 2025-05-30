import { BaseEntity } from '@app/base-entity';
import { Accompaniement } from 'src/accompaniement/entities/accompaniement.entity';
import { RequestStatusEnum } from 'src/property-request/enums/request-status.enum';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('accompagniement_request')
export class AccompagniementRequest extends BaseEntity {
  @ManyToOne(
    () => Accompaniement,
    (Accompaniement: Accompaniement) => Accompaniement.requests,
    {
      cascade: true,
    },
  )
  @JoinColumn({ name: 'accompaniement_id', referencedColumnName: 'id' })
  accompaniement: Accompaniement;

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
