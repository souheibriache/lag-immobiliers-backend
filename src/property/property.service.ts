import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Property } from './entities/property.entity';
import { Price } from './entities/property-price.entity';
import { PropertyCharacteristic } from './entities/property-characteristic.entity';
import { Address } from 'src/address/entities/address.entity';
import { UploadService } from '@app/upload';
import { MediaService } from '@app/media';
import { CreatePropertyDto } from './dto/create-property.dto';
import { ResourceTypeEnum } from '@app/media/enums/resource-type.enum';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ReorderImagesDto } from './dto/update-image-order.dto';
import { Media } from '@app/media/entities';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { PaginatedResponseDto } from '@app/pagination/dto/paginated-response.dto';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    @InjectRepository(PropertyCharacteristic)
    private readonly characteristicRepository: Repository<PropertyCharacteristic>,
    @InjectRepository(Media)
    private readonly imageRepository: Repository<Media>,
    private readonly uploadService: UploadService,
    private readonly mediaService: MediaService,
  ) {}

  async create(
    dto: CreatePropertyDto,
    imageFiles: Express.Multer.File[],
  ): Promise<Property> {
    const address = this.addressRepository.create(dto.address);
    await this.addressRepository.save(address);

    const property = this.propertyRepository.create({
      title: dto.title,
      description: dto.description,
      googleMapUrl: dto.googleMapUrl,
      isFeatured: dto.isFeatured ?? false,
      address,
    });
    await this.propertyRepository.save(property);

    const price = this.priceRepository.create({
      ...dto.price,
    });
    const savedPrice = await this.priceRepository.save(price);
    property.price = savedPrice;
    await price.save();

    if (dto.characteristics?.length) {
      const chars = dto.characteristics.map((characteristic) =>
        this.characteristicRepository.create({
          ...characteristic,
          property: property,
        }),
      );
      await this.characteristicRepository.save(chars);
    }

    if (imageFiles?.length) {
      const bucket = 'properties';
      const imgs = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const upload = await this.uploadService.upload(file, bucket);
        if (!upload) throw new InternalServerErrorException('Upload failed');
        const media = await this.mediaService.create({
          fullUrl: upload.fullUrl,
          name: upload.name,
          originalName: upload.originalName,
          placeHolder: upload.placeHolder,
          resourceType: ResourceTypeEnum.AUTO,
        });
        const img = this.imageRepository.create({
          ...media,
          order: i,
        });
        imgs.push(img);
      }
      property.images = await this.imageRepository.save(imgs);
      await property.save();
    }

    return this.findOne(property.id);
  }

  findAll(): Promise<Property[]> {
    return this.propertyRepository.find({
      relations: {
        address: true,
        price: true,
        characteristics: true,
        images: true,
      },
    });
  }

  async findOne(id: string): Promise<Property> {
    const prop = await this.propertyRepository.findOne({
      where: { id },
      relations: {
        address: true,
        price: true,
        characteristics: true,
        images: true,
      },
    });
    if (!prop) throw new NotFoundException(`Property ${id} not found`);
    return prop;
  }

  async update(
    id: string,
    dto: UpdatePropertyDto,
    imageFiles?: Express.Multer.File[],
  ): Promise<Property> {
    let existing = await this.findOne(id);

    if (dto.address) {
      await this.addressRepository.update(existing.address.id, dto.address);
    }

    await this.propertyRepository.update(id, {
      title: dto.title,
      description: dto.description,
      googleMapUrl: dto.googleMapUrl,
      ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
    });

    if (dto.price) {
      if (existing?.price?.id)
        await this.priceRepository.update(existing?.price?.id, dto.price);
      else {
        existing = await this.findOne(id);
        const price = this.priceRepository.create({
          ...dto.price,
        });
        const savedPrice = await this.priceRepository.save(price);
        existing.price = savedPrice;
        await existing.save();
      }
    }

    if (dto.characteristics) {
      await this.characteristicRepository.delete({ property: { id } });
      const characteristics = dto.characteristics.map((c) =>
        this.characteristicRepository.create({ ...c, property: existing }),
      );
      await this.characteristicRepository.save(characteristics);
    }

    if (imageFiles) {
      existing = await this.findOne(id);

      const bucket = 'properties';
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const upload = await this.uploadService.upload(file, bucket);
        if (!upload) throw new InternalServerErrorException('Upload failed');
        const media = await this.mediaService.create({
          fullUrl: upload.fullUrl,
          name: upload.name,
          originalName: upload.originalName,
          placeHolder: upload.placeHolder,
          resourceType: ResourceTypeEnum.AUTO,
        });
        await this.imageRepository.delete({
          id: In(existing.images.map((image) => image.id)),
        });
        const img = this.imageRepository.create({
          ...media,
          order: i,
        });
        existing.images.push(await this.imageRepository.save(img));
      }
      await existing.save();
    }

    return await this.findOne(existing.id);
  }

  async reorder(dto: ReorderImagesDto): Promise<Media[]> {
    const { propertyId, imagesOrder } = dto;

    const ids = imagesOrder.map((i) => i.id);
    const property = await this.findOne(propertyId);
    const { images } = property;

    if (images.length !== ids.length) {
      throw new BadRequestException(
        'Une ou plusieurs images sont invalides ou ne correspondent pas à cette propriété',
      );
    }

    await Promise.all(
      imagesOrder.map(({ id, order }) =>
        this.imageRepository.update(id, { order }),
      ),
    );

    const updated = await this.findOne(propertyId);
    return updated.images;
  }

  async remove(id: string): Promise<Property> {
    const prop = await this.findOne(id);
    return await this.propertyRepository.remove(prop);
  }

  async removeImage(propertyId, imageId) {
    const property = await this.findOne(propertyId);
    const imageToDelete = property.images.find((image) => image.id === imageId);
    if (imageToDelete) {
      property.images = property.images.filter((image) => image.id !== imageId);
      await property.save();
      await this.mediaService.delete(imageId);
    }
    return await this.findOne(propertyId);
  }

  async findFiltered(
    filterDto: FilterPropertyDto,
  ): Promise<PaginatedResponseDto<Property>> {
    const {
      page = 1,
      take = 10,
      search,
      isFeatured,
      minPrice,
      maxPrice,
    } = filterDto;

    const skip = (page - 1) * take;

    const queryBuilder = this.propertyRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.address', 'address')
      .leftJoinAndSelect('property.price', 'price')
      .leftJoinAndSelect('property.characteristics', 'characteristics')
      .leftJoinAndSelect('property.images', 'images');

    if (search) {
      queryBuilder.andWhere(
        '(property.title ILIKE :search OR property.description ILIKE :search OR ' +
          'address.addressLine1 ILIKE :search OR address.city ILIKE :search OR ' +
          'address.postalCode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (isFeatured !== undefined) {
      queryBuilder.andWhere('property.isFeatured = :isFeatured', {
        isFeatured,
      });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('price.monthlyPrice >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('price.monthlyPrice <= :maxPrice', { maxPrice });
    }

    const total = await queryBuilder.getCount();

    queryBuilder.skip(skip).take(take);

    const items = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / take);

    return {
      items,
      total,
      page,
      take,
      totalPages,
    };
  }
}
