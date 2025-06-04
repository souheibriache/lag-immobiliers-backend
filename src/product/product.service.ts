import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { Category, Product } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UploadService } from '@app/upload';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductImagesDto } from './dto/update-product-images.dto';
import { UpdateImageOrderDto } from './dto/image-order-item.dto';
import { Media } from '@app/media/entities';
import { ProductTypeEnum } from './enums/product-type.enum';
import { ProductSearchDto } from './dto/product-search.dto';
import { ResourceTypeEnum } from '@app/media/enums/resource-type.enum';
import { CreateCategoryDto } from './dto/create-category.dto';
import { MediaService } from '@app/media';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Media)
    private readonly productImageRepository: Repository<Media>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly uploadService: UploadService,
    private readonly mediaService: MediaService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    images: Express.Multer.File[],
  ) {
    const { category, ...rest } = createProductDto;
    const product = this.productRepository.create(rest);

    const savedProduct = await this.productRepository.save(product);

    const uploadedFiles = await this.uploadService.uploadMany(
      images,
      'products',
    );
    console.log({ uploadedFiles });

    const productImages = uploadedFiles.map((image, index) =>
      this.productImageRepository.create({
        fullUrl: image.fullUrl,
        order: index,
        originalName: image.originalName,
        name: image.name,
        placeHolder: image.placeHolder,
        resourceType: ResourceTypeEnum.IMAGE,
      }),
    );

    if (productImages.length > 0) {
      savedProduct.images =
        await this.productImageRepository.save(productImages);
    } else {
      savedProduct.images = [];
    }

    await savedProduct.save();

    if (createProductDto.category) {
      const newCategory = await this.categoryRepository.findOne({
        where: { id: createProductDto.category },
      });
      savedProduct.category = newCategory;
    } else {
      savedProduct.category = null;
    }

    return await this.productRepository.save(savedProduct);
  }

  async find(
    where?: FindOptionsWhere<Product>,
    relations?: FindOptionsRelations<Product>,
    order?: FindOptionsOrder<Product>,
  ) {
    return await this.productRepository.find({ where, relations, order });
  }

  async findByType(type: ProductTypeEnum, searchDto: ProductSearchDto = {}) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.type = :type', { type })
      .orderBy('images.order', 'ASC');

    if (searchDto.q) {
      queryBuilder.andWhere(
        '(LOWER(product.title) LIKE LOWER(:search) OR LOWER(product.description) LIKE LOWER(:search))',
        { search: `%${searchDto.q}%` },
      );
    }

    if (searchDto.categoryId) {
      queryBuilder.andWhere('product.category_id = :categoryId', {
        categoryId: searchDto.categoryId,
      });
    }

    if (searchDto.isFeatured !== undefined) {
      queryBuilder.andWhere('product.isFeatured = :isFeatured', {
        isFeatured: searchDto.isFeatured,
      });
    }

    if (searchDto.characteristic) {
      queryBuilder.andWhere(':characteristic = ANY(product.characteristics)', {
        characteristic: searchDto.characteristic,
      });
    }

    if (searchDto.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: searchDto.minPrice,
      });
    }

    if (searchDto.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: searchDto.maxPrice,
      });
    }

    if (searchDto.hasDiscount) {
      queryBuilder.andWhere('product.discount > 0');
    }

    return await queryBuilder.getMany();
  }

  async getCategories() {
    return await this.categoryRepository.find();
  }

  async deleteCategory(categoryId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found:');
    return await this.categoryRepository.remove(category);
  }

  async createCategory(dto: CreateCategoryDto) {
    const category = this.categoryRepository.create(dto);
    return await this.categoryRepository.save(category);
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: {
        images: true,
        category: true,
      },
      order: {
        images: {
          order: 'ASC',
        },
      },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    imageFiles?: Express.Multer.File[],
  ) {
    let product = await this.findOne(id);

    const { category, ...rest } = updateProductDto;
    await this.productRepository.update(id, rest);

    if (updateProductDto.category) {
      const newCategory = await this.categoryRepository.findOne({
        where: { id: updateProductDto.category },
      });
      product.category = newCategory;
      await this.productRepository.save(product);
    }

    if (imageFiles) {
      product = await this.findOne(id);

      const bucket = 'products';
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
        await this.productImageRepository.delete({
          id: In(product.images.map((image) => image.id)),
        });
        const img = this.productImageRepository.create({
          ...media,
          order: i,
        });
        product.images.push(await this.productImageRepository.save(img));
      }
      await product.save();
    }

    return await this.findOne(id);
  }

  async updateImagesOrder(
    id: string,
    updateImageOrderDto: UpdateImageOrderDto,
  ) {
    const product = await this.findOne(id);

    const imageMap = new Map(product.images.map((image) => [image.id, image]));

    for (const item of updateImageOrderDto.images) {
      const image = imageMap.get(item.id);

      if (!image) {
        throw new NotFoundException(`Image with ID ${item.id} not found`);
      }

      image.order = item.order;
    }

    await this.productImageRepository.save([...imageMap.values()]);

    return await this.findOne(id);
  }

  async delete(id: string) {
    const product = await this.findOne(id);
    return await this.productRepository.remove(product);
  }

  async deleteImage(id: string, imageId: string) {
    const product = await this.findOne(id);

    const imageExists = product.images.some((image) => image.id === imageId);
    if (!imageExists) {
      throw new NotFoundException(`Image with ID ${imageId} not found`);
    }

    await this.productImageRepository.delete(imageId);

    const remainingImages = product.images.filter(
      (image) => image.id !== imageId,
    );
    remainingImages.sort((a, b) => a.order - b.order);

    for (let i = 0; i < remainingImages.length; i++) {
      remainingImages[i].order = i;
    }

    if (remainingImages.length > 0) {
      await this.productImageRepository.save(remainingImages);
    }

    return true;
  }
}
