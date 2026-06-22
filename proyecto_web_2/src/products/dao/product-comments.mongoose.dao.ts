// src/products/dao/product-comments.mongoose.dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductComment } from '../schemas/product-comment.schema';

export interface IProductCommentsDao {
  create(commentData: Partial<ProductComment>): Promise<ProductComment>;
  findByProductId(productId: string): Promise<ProductComment[]>;
}

@Injectable()
export class ProductCommentsMongooseDao implements IProductCommentsDao {
  constructor(
    @InjectModel(ProductComment.name)
    private readonly productCommentModel: Model<ProductComment>,
  ) {}

  async create(commentData: Partial<ProductComment>): Promise<ProductComment> {
    const createdComment = new this.productCommentModel(commentData);
    return createdComment.save();
  }

  async findByProductId(productId: string): Promise<ProductComment[]> {
    return this.productCommentModel
      .find({ productId })
      .sort({ createdAt: 1 })
      .exec();
  }
}