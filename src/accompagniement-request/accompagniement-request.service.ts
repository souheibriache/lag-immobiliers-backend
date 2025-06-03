import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import { AccompagniementRequest } from './entities/accompagniement-request.entity';
import type { CreateAccompagniementRequestDto } from './dto/create-accompagniement-request.dto';
import type { FilterAccompagnementRequestDto } from './dto/filter-accompagnement-request.dto';
import type { PaginatedAccompagnementRequestResponseDto } from './dto/paginated-accompagnement-request-response.dto';
import { RequestStatusEnum } from 'src/property-request/enums/request-status.enum';
import { UpdateAccompaniementRequestStatusDto } from './dto/update-accompagniement-request.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AccompagniementRequestService {
  constructor(
    @InjectRepository(AccompagniementRequest)
    private readonly requestRepository: Repository<AccompagniementRequest>,
  ) {}

  async create(
    dto: CreateAccompagniementRequestDto,
  ): Promise<AccompagniementRequest> {
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
      accompaniement: { id: dto.accompaniementId } as any,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: trimmedEmail,
      phoneNumber: trimmedPhone,
      message: dto.message,
    });
    return this.requestRepository.save(request);
  }

  findAll(): Promise<AccompagniementRequest[]> {
    return this.requestRepository.find({
      relations: { accompaniement: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findFiltered(
    filterDto: FilterAccompagnementRequestDto,
  ): Promise<PaginatedAccompagnementRequestResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      accompagnementId,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    const skip = (page - 1) * limit;

    // Build the query
    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.accompaniement', 'accompaniement')
      .leftJoinAndSelect('accompaniement.images', 'images');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(request.firstName ILIKE :search OR request.lastName ILIKE :search OR ' +
          'request.email ILIKE :search OR request.phoneNumber ILIKE :search OR ' +
          'accompaniement.title ILIKE :search OR accompaniement.shortDescription ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply status filter
    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }

    // Apply accompagnement filter
    if (accompagnementId) {
      queryBuilder.andWhere('request.accompaniement.id = :accompagnementId', {
        accompagnementId,
      });
    }

    // Apply date filters
    if (fromDate) {
      queryBuilder.andWhere('request.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('request.createdAt <= :toDate', { toDate });
    }

    // Apply sorting
    const validSortFields = [
      'createdAt',
      'firstName',
      'lastName',
      'email',
      'status',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`request.${sortField}`, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const items = await queryBuilder.getMany();

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };
  }

  async findOne(id: string): Promise<AccompagniementRequest> {
    const req = await this.requestRepository.findOne({
      where: { id },
      relations: {
        accompaniement: {
          images: true,
          characteristics: true,
        },
      },
    });
    if (!req) throw new NotFoundException(`Request ${id} not found`);
    return req;
  }

  async updateStatus(
    id: string,
    dto: UpdateAccompaniementRequestStatusDto,
  ): Promise<AccompagniementRequest> {
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
