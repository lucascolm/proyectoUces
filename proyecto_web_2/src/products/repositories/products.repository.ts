// src/products/repositories/products.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import type { IProductsDao } from '../dao/products.mongoose.dao';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { Product } from '../schemas/product.schema';

export interface IProductsRepository {
  create(productData: Partial<Product>): Promise<Product>;
  findPublic(query: ListProductsQueryDto): Promise<Product[]>;
  findPublicById(id: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  findMine(ownerId: string): Promise<Product[]>;
  update(id: string, updateData: Partial<Product>): Promise<Product | null>;
  softDelete(id: string): Promise<Product | null>;
}

@Injectable()
export class ProductsRepository implements IProductsRepository {
  constructor(
    @Inject('IProductsDao')
    private readonly dao: IProductsDao,
  ) {}

  async create(productData: Partial<Product>): Promise<Product> {
    return this.dao.create(productData);
  }

  async findPublic(query: ListProductsQueryDto): Promise<Product[]> {
    return this.dao.findPublic(query);
  }

  async findPublicById(id: string): Promise<Product | null> {
    return this.dao.findPublicById(id);
  }

  async findById(id: string): Promise<Product | null> {
    return this.dao.findById(id);
  }

  async findMine(ownerId: string): Promise<Product[]> {
    return this.dao.findMine(ownerId);
  }

  async update(id: string, updateData: Partial<Product>): Promise<Product | null> {
    return this.dao.update(id, updateData);
  }

  async softDelete(id: string): Promise<Product | null> {
    return this.dao.softDelete(id);
  }
}