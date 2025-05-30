import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Address } from 'src/address/entities/address.entity';
import { Product } from 'src/product/entities/product.entity';
import { RequestStatusEnum } from 'src/property-request/enums/request-status.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const product = await this.productRepo.findOneBy({ id: dto.productId });
    if (!product)
      throw new NotFoundException(`Product ${dto.productId} not found`);

    const addr = this.addressRepo.create(dto.address);
    await this.addressRepo.save(addr);

    const order = this.orderRepo.create({
      product,
      address: addr,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
    });
    return this.orderRepo.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({
      relations: { product: true, address: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { product: true, address: true },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async updateOrder(id: string, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (dto.address) {
      await this.addressRepo.update(order.address.id, dto.address);
    }

    const { firstName, lastName, email, phoneNumber, isPaid } = dto;
    await this.orderRepo.update(id, {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(isPaid !== undefined && { isPaid }),
    });

    return this.findOne(id);
  }

  async updateOrderStatus(id: string, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    order.status = dto.status;
    return this.orderRepo.save(order);
  }

  async setProductToPaid(orderId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    order.isPaid = true;
    order.status = RequestStatusEnum.PENDING;
    return this.orderRepo.save(order);
  }

  async delete(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepo.remove(order);
  }
}
