import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Accompaniement } from './entities/accompaniement.entity';
import { Media } from '@app/media/entities';
import { CreateAccompaniementDto } from './dto/create-accompaniement.dto';
import { UpdateAccompaniementDto } from './dto/update-accompaniement.dto';
import { UploadService } from '@app/upload';
import { MediaService } from '@app/media';
import { ResourceTypeEnum } from '@app/media/enums/resource-type.enum';
import { ReorderAccompaniementsDto } from './dto/reorder-accompagnement.dto';

@Injectable()
export class AccompaniementService {
  constructor(
    @InjectRepository(Accompaniement)
    private readonly repo: Repository<Accompaniement>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly uploadService: UploadService,
    private readonly mediaService: MediaService,
  ) {}

  async create(
    dto: CreateAccompaniementDto,
    imageFiles: Express.Multer.File[],
  ): Promise<Accompaniement> {
    const maxOrder = await this.repo
      .createQueryBuilder('accompaniement')
      .select('MAX(accompaniement.order)', 'max')
      .getRawOne();

    const nextOrder = (maxOrder?.max || 0) + 1;

    const ent = this.repo.create({
      title: dto.title,
      description: dto.description,
      shortDescription: dto.shortDescription,
      characteristics: dto.characteristics,
      order: nextOrder,
      price: dto.price || 0,
    });
    const saved = await this.repo.save(ent);

    if (imageFiles?.length) {
      const uploads = await this.uploadService.uploadMany(
        imageFiles,
        'accompaniement',
      );
      const medias = [];
      for (let i = 0; i < uploads.length; i++) {
        const u = uploads[i];
        const m = await this.mediaService.create({
          fullUrl: u.fullUrl,
          name: u.name,
          originalName: u.originalName,
          placeHolder: u.placeHolder,
          resourceType: ResourceTypeEnum.AUTO,
        });
        medias.push(m);
      }
      saved.images = await this.mediaRepo.save(medias);
      await this.repo.save(saved);
    }

    return this.findOne(saved.id);
  }

  findAll(): Promise<Accompaniement[]> {
    return this.repo.find({
      relations: {
        images: true,
      },
      order: {
        order: 'ASC',
        images: {
          order: 'ASC',
        },
      },
    });
  }

  async findOne(id: string): Promise<Accompaniement> {
    const ent = await this.repo.findOne({
      where: { id },
      relations: {
        images: true,
      },
      order: {
        images: {
          order: 'ASC',
        },
      },
    });
    if (!ent) throw new NotFoundException(`Accompagnement ${id} introuvable`);
    return ent;
  }

  async update(
    id: string,
    dto: UpdateAccompaniementDto,
    imageFiles?: Express.Multer.File[],
  ): Promise<Accompaniement> {
    const ent = await this.findOne(id);
    Object.assign(ent, dto);

    if (imageFiles) {
      ent.images = [];
      await this.repo.save(ent);

      const uploads = await this.uploadService.uploadMany(
        imageFiles,
        'accompaniement',
      );
      const medias = [];
      for (let i = 0; i < uploads.length; i++) {
        const u = uploads[i];
        const m = await this.mediaService.create({
          fullUrl: u.fullUrl,
          name: u.name,
          originalName: u.originalName,
          placeHolder: u.placeHolder,
          resourceType: ResourceTypeEnum.AUTO,
        });
        medias.push(m);
      }
      ent.images = await this.mediaRepo.save(medias);
    }

    return this.repo.save(ent);
  }

  async reorder(dto: ReorderAccompaniementsDto): Promise<Accompaniement[]> {
    const ids = dto.items.map((i) => i.id);
    const ents = await this.repo.findBy({ id: In(ids) });
    if (ents.length !== ids.length) {
      throw new NotFoundException('Certains accompagnements introuvables');
    }
    const map = new Map(dto.items.map((i) => [i.id, i.order]));
    ents.forEach((e) => (e.order = map.get(e.id)));
    await this.repo.save(ents);
    return this.findAll();
  }

  async reorderImages(dto: ReorderAccompaniementsDto): Promise<void> {
    const { items } = dto;

    await Promise.all(
      items.map(({ id, order }) => this.mediaRepo.update(id, { order })),
    );
  }

  async delete(id: string): Promise<void> {
    const ent = await this.findOne(id);
    await this.repo.remove(ent);
  }

  async deleteImage(imageId: string): Promise<void> {
    await this.mediaRepo.delete(imageId);
  }
}
