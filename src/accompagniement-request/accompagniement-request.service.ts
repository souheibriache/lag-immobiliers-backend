import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccompagniementRequest } from './entities/accompagniement-request.entity';
import { Repository } from 'typeorm';
import { CreateAccompagniementRequestDto } from './dto/create-accompagniement-request.dto';
import { RequestStatusEnum } from 'src/property-request/enums/request-status.enum';
import { UpdateAccompaniementRequestStatusDto } from './dto/update-accompagniement-request.dto';

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
    return this.requestRepository.find({ relations: { accompaniement: true } });
  }

  async findOne(id: string): Promise<AccompagniementRequest> {
    const req = await this.requestRepository.findOne({
      where: { id },
      relations: { accompaniement: true },
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

  async remove(id: string) {
    const request = await this.findOne(id);
    return await this.requestRepository.remove(request);
  }
}
