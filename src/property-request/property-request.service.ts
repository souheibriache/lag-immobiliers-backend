// property-request.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyRequest } from './entities/property-request.entity';
import { CreatePropertyRequestDto } from './dto/create-property-request.dto';
import { RequestStatusEnum } from './enums/request-status.enum';
import { UpdatePropertyRequestStatusDto } from './dto/update-property-request.dto';

@Injectable()
export class PropertyRequestService {
  constructor(
    @InjectRepository(PropertyRequest)
    private readonly requestRepository: Repository<PropertyRequest>,
  ) {}

  async create(dto: CreatePropertyRequestDto): Promise<PropertyRequest> {
    const { email, phoneNumber } = dto;
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();
    const existing = await this.requestRepository.findOne({
      where: [
        { phoneNumber: trimmedPhone, status: RequestStatusEnum.PENDING },
        { email: trimmedEmail, status: RequestStatusEnum.PENDING },
      ],
    });
    if (existing)
      throw new BadRequestException(
        'Vous avez deja une demande avec cet address mail ou ce numero de telephone',
      );

    const request = this.requestRepository.create({
      property: { id: dto.propertyId } as any,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: trimmedEmail,
      phoneNumber: trimmedPhone,
      message: dto.message,
    });
    return this.requestRepository.save(request);
  }

  findAll(): Promise<PropertyRequest[]> {
    return this.requestRepository.find({ relations: { property: true } });
  }

  async findOne(id: string): Promise<PropertyRequest> {
    const req = await this.requestRepository.findOne({
      where: { id },
      relations: { property: true },
    });
    if (!req) throw new NotFoundException(`Request ${id} not found`);
    return req;
  }

  async updateStatus(
    id: string,
    dto: UpdatePropertyRequestStatusDto,
  ): Promise<PropertyRequest> {
    const req = await this.findOne(id);
    req.status = dto.status;
    return this.requestRepository.save(req);
  }

  async remove(id: string) {
    const request = await this.findOne(id);
    return await this.requestRepository.remove(request);
  }
}
