// src/products/services/product-comments.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersService } from '../../users/services/users.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { ProductCommentResponseDto } from '../dto/product-comment-response.dto';
import type { IProductCommentsRepository } from '../repositories/product-comments.repository';
import { ProductComment } from '../schemas/product-comment.schema';
import { ProductsService } from './products.service';

@Injectable()
export class ProductCommentsService {
  constructor(
    @Inject('IProductCommentsRepository')
    private readonly productCommentsRepository: IProductCommentsRepository,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    productId: string,
    authorId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<ProductCommentResponseDto> {
    await this.productsService.findActiveEntityOrThrow(productId);

    const comment = await this.productCommentsRepository.create({
      productId: new Types.ObjectId(productId),
      authorId: new Types.ObjectId(authorId),
      message: createCommentDto.message,
    });

    return this.toCommentResponse(comment);
  }

  async findByProductId(productId: string): Promise<ProductCommentResponseDto[]> {
    await this.productsService.findActiveEntityOrThrow(productId);

    const comments = await this.productCommentsRepository.findByProductId(productId);

    return Promise.all(
      comments.map((comment) => this.toCommentResponse(comment)),
    );
  }

  private async toCommentResponse(
    comment: ProductComment,
  ): Promise<ProductCommentResponseDto> {
    const author = await this.usersService.findById(comment.authorId.toString());
    const doc = comment as ProductComment & { createdAt: Date; updatedAt: Date };

    return {
      id: comment._id.toString(),
      productId: comment.productId.toString(),
      authorId: comment.authorId.toString(),
      message: comment.message,
      author: {
        id: comment.authorId.toString(),
        name: author.name,
        surname: author.surname,
      },
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
