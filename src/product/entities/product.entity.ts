import { BaseEntity } from '@app/base-entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Category } from './category.entity';
import { ProductTypeEnum } from '../enums/product-type.enum';
import { Media } from '@app/media/entities';

@Entity('product')
export class Product extends BaseEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  link: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category?: Category;

  @Column({
    type: 'enum',
    enum: ProductTypeEnum,
    default: ProductTypeEnum.PRODUCT,
  })
  type: ProductTypeEnum;

  @Column({ type: 'float', default: 0 })
  price: number;

  @Column({ default: 0, type: 'float' })
  discount: number;

  @ManyToMany(() => Media)
  @JoinTable({ name: 'product_images' })
  images: Media[];

  @Column({ array: true, type: 'text' })
  characteristics: string[];

  @Column({ type: 'boolean' })
  isFeatured: boolean;
}
