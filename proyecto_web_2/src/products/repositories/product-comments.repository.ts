// src/products/repositories/product-comments.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import type { IProductCommentsDao } from '../dao/product-comments.mongoose.dao';
import { ProductComment } from '../schemas/product-comment.schema';

export interface IProductCommentsRepository {
  create(commentData: Partial<ProductComment>): Promise<ProductComment>;
  findByProductId(productId: string): Promise<ProductComment[]>;
}

@Injectable()
export class ProductCommentsRepository implements IProductCommentsRepository {
  constructor(
    @Inject('IProductCommentsDao')
    private readonly dao: IProductCommentsDao,
  ) {}

  async create(commentData: Partial<ProductComment>): Promise<ProductComment> {
    return this.dao.create(commentData);
  }

  async findByProductId(productId: string): Promise<ProductComment[]> {
    return this.dao.findByProductId(productId);
  }
}