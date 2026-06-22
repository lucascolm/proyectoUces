import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Types } from 'mongoose';
import { UsersService } from '../../users/services/users.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
// import {
//   PublicProductOwnerDto,
//   PublicProductResponseDto,
// } from '../dto/public-product-responde.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import type { IProductsRepository } from '../repositories/products.repository';
import { Product } from '../schemas/product.schema';
import { PublicProductOwnerDto, PublicProductResponseDto } from '../dto/public-product-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('IProductsRepository')
    private readonly productsRepository: IProductsRepository,
    private readonly usersService: UsersService,
  ) {}

  async create(
    ownerId: string,
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    try {
      const product = await this.productsRepository.create({
        ...createProductDto,
        ownerId: new Types.ObjectId(ownerId),
        imagesBase64: createProductDto.imagesBase64 ?? [],
        isActive: true,
      });

      return this.toProductResponse(product);
    } catch {
      throw new InternalServerErrorException('Could not create product');
    }
  }

  async findPublic(query: ListProductsQueryDto = {}): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.findPublic(query);
    return products.map((product) => this.toProductResponse(product));
  }

  async findPublicById(id: string): Promise<PublicProductResponseDto> {
    const product = await this.findActiveEntityOrThrow(id);
    const owner = await this.usersService.findById(product.ownerId.toString());

    return {
      ...this.toProductResponse(product),
      owner: {
        id: product.ownerId.toString(),
        name: owner.name,
        surname: owner.surname,
      } as PublicProductOwnerDto,
    };
  }

  async findMine(ownerId: string): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.findMine(ownerId);
    return products.map((product) => this.toProductResponse(product));
  }

  async update(
    productId: string,
    userId: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    await this.findOwnedEntityOrThrow(productId, userId);

    const updatedProduct = await this.productsRepository.update(
      productId,
      updateProductDto,
    );

    if (!updatedProduct) {
      throw new NotFoundException('Product not found');
    }

    return this.toProductResponse(updatedProduct);
  }

  async delete(productId: string, userId: string) {
    await this.findOwnedEntityOrThrow(productId, userId);
    await this.productsRepository.softDelete(productId);

    return {
      message: 'Product deleted successfully',
    };
  }

  async findActiveEntityOrThrow(id: string): Promise<Product> {
    const product = await this.productsRepository.findPublicById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findOwnedEntityOrThrow(id: string, userId: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.ownerId.toString() !== userId) {
      throw new ForbiddenException('You do not own this product');
    }

    return product;
  }

  private toProductResponse(product: Product): ProductResponseDto {
    return plainToClass(ProductResponseDto, {
      id: product._id.toString(),
      ownerId: product.ownerId.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      paymentOptions: product.paymentOptions,
      imagesBase64: product.imagesBase64,
      isActive: product.isActive,
    });
  }
}