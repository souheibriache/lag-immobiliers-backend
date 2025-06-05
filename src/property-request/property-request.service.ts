import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PropertyRequest } from './entities/property-request.entity';
import { CreatePropertyRequestDto } from './dto/create-property-request.dto';
import { RequestStatusEnum } from './enums/request-status.enum';
import { UpdatePropertyRequestStatusDto } from './dto/update-property-request.dto';
import { FilterPropertyRequestDto } from './dto/filter-property-request.dto';
import { PaginatedPropertyRequestResponseDto } from './dto/paginated-property-request-response.dto';

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
    const propertyRequestForbiddenStatus = [
      RequestStatusEnum.PENDING,
      RequestStatusEnum.ACCEPTED,
      RequestStatusEnum.REJECTED,
    ];
    const existing = await this.requestRepository.findOne({
      where: [
        {
          phoneNumber: trimmedPhone,
          status: In(propertyRequestForbiddenStatus),
          property: { id: dto.propertyId },
        },
        {
          email: trimmedEmail,
          status: In(propertyRequestForbiddenStatus),
          property: { id: dto.propertyId },
        },
      ],
    });
    if (existing)
      throw new BadRequestException(
        'Vous avez déjà une demande avec cette adresse mail ou ce numéro de téléphone pour ce bien.',
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
    return this.requestRepository.find({
      relations: { property: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findFiltered(
    filterDto: FilterPropertyRequestDto,
  ): Promise<PaginatedPropertyRequestResponseDto> {
    const {
      page = 1,
      take = 10,
      search,
      status,
      propertyId,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const skip = (page - 1) * take;

    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.property', 'property')
      .leftJoinAndSelect('property.address', 'address')
      .leftJoinAndSelect('property.images', 'images');

    if (search) {
      queryBuilder.andWhere(
        '(request.firstName ILIKE :search OR request.lastName ILIKE :search OR ' +
          'request.email ILIKE :search OR request.phoneNumber ILIKE :search OR ' +
          'property.title ILIKE :search OR address.city ILIKE :search OR ' +
          'address.addressLine1 ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }

    if (propertyId) {
      queryBuilder.andWhere('request.property.id = :propertyId', {
        propertyId,
      });
    }

    if (fromDate) {
      queryBuilder.andWhere('request.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('request.createdAt <= :toDate', { toDate });
    }

    const validSortFields = [
      'createdAt',
      'firstName',
      'lastName',
      'email',
      'status',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`request.${sortField}`, sortOrder);

    const total = await queryBuilder.getCount();

    queryBuilder.skip(skip).take(take);

    const items = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / take);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      items,
      total,
      page,
      take,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  async findOne(id: string): Promise<PropertyRequest> {
    const req = await this.requestRepository.findOne({
      where: { id },
      relations: {
        property: {
          address: true,
          images: true,
        },
      },
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

  async getRequestStats(): Promise<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    cancelled: number;
  }> {
    const [total, pending, accepted, rejected, cancelled] = await Promise.all([
      this.requestRepository.count(),
      this.requestRepository.count({
        where: { status: RequestStatusEnum.PENDING },
      }),
      this.requestRepository.count({
        where: { status: RequestStatusEnum.ACCEPTED },
      }),
      this.requestRepository.count({
        where: { status: RequestStatusEnum.REJECTED },
      }),
      this.requestRepository.count({
        where: { status: RequestStatusEnum.CANCELLED },
      }),
    ]);

    return { total, pending, accepted, rejected, cancelled };
  }

  async remove(id: string) {
    const request = await this.findOne(id);
    return await this.requestRepository.remove(request);
  }
}
