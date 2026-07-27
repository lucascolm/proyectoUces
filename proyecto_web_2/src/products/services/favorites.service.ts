// src/products/services/favorites.service.ts
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { FavoriteResponseDto } from '../dto/favorite-response.dto';
import type { IFavoritesRepository } from '../repositories/favorites.repository';
import { Favorite } from '../schemas/favorite.schema';
import { ProductsService } from './products.service';

@Injectable()
export class FavoritesService {
  constructor(
    @Inject('IFavoritesRepository')
    private readonly favoritesRepository: IFavoritesRepository,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: string, productId: string): Promise<FavoriteResponseDto> {
    const existingFavorite = await this.favoritesRepository.findByUserAndProduct(
      userId,
      productId,
    );

    if (existingFavorite) {
      throw new ConflictException('Product already in favorites');
    }

    const product = await this.productsService.findActiveEntityOrThrow(productId);

    const favorite = await this.favoritesRepository.create({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
    });

    return this.toFavoriteResponse(favorite, product);
  }

  async remove(userId: string, productId: string) {
    const deleted = await this.favoritesRepository.deleteByUserAndProduct(
      userId,
      productId,
    );

    return { deleted };
  }

  async findMine(userId: string): Promise<FavoriteResponseDto[]> {
    const favorites = await this.favoritesRepository.findByUserId(userId);

    const responses = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          const product = await this.productsService.findActiveEntityOrThrow(
            favorite.productId.toString(),
          );

          return this.toFavoriteResponse(favorite, product);
        } catch (error) {
          if (error instanceof NotFoundException) {
            return null;
          }

          throw error;
        }
      }),
    );

    return responses.filter(
      (favorite): favorite is FavoriteResponseDto => favorite !== null,
    );
  }

  private toFavoriteResponse(
    favorite: Favorite,
    product: {
      _id: { toString(): string };
      name: string;
      price: number;
      category: string;
      isActive: boolean;
    },
  ): FavoriteResponseDto {
    const doc = favorite as Favorite & { createdAt: Date };

    return {
      favoriteId: favorite._id.toString(),
      productId: favorite.productId.toString(),
      savedAt: doc.createdAt,
      product: {
        id: product._id.toString(),
        name: product.name,
        price: product.price,
        category: product.category as FavoriteResponseDto['product']['category'],
        isActive: product.isActive,
      },
    };
  }
}
