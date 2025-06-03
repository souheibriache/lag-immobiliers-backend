import { BaseEntity } from '@app/base-entity';
import { Media } from '@app/media/entities';
import { AccompagniementRequest } from 'src/accompagniement-request/entities/accompagniement-request.entity';
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';

@Entity('accompaniement')
export class Accompaniement extends BaseEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  shortDescription: string;

  @Column({ type: 'int8', default: 0 })
  order: number;

  @Column({ type: 'float' })
  price: number;

  @Column({ array: true, type: 'text' })
  characteristics: string[];

  @ManyToMany(() => Media, { cascade: true })
  @JoinTable({ name: 'accompaniement_images' })
  images: Media[];

  @OneToMany(
    () => AccompagniementRequest,
    (request: AccompagniementRequest) => request.accompaniement,
    { nullable: true },
  )
  requests: AccompagniementRequest[];
}
