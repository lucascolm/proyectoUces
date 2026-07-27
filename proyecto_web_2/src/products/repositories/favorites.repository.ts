// src/products/repositories/favorites.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import type { IFavoritesDao } from '../dao/favorites.mongoose.dao';
import { Favorite } from '../schemas/favorite.schema';

export interface IFavoritesRepository {
  create(favoriteData: Partial<Favorite>): Promise<Favorite>;
  findByUserAndProduct(userId: string, productId: string): Promise<Favorite | null>;
  findByUserId(userId: string): Promise<Favorite[]>;
  deleteByUserAndProduct(userId: string, productId: string): Promise<boolean>;
}

@Injectable()
export class FavoritesRepository implements IFavoritesRepository {
  constructor(
    @Inject('IFavoritesDao')
    private readonly dao: IFavoritesDao,
  ) {}

  async create(favoriteData: Partial<Favorite>): Promise<Favorite> {
    return this.dao.create(favoriteData);
  }

  async findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<Favorite | null> {
    return this.dao.findByUserAndProduct(userId, productId);
  }

  async findByUserId(userId: string): Promise<Favorite[]> {
    return this.dao.findByUserId(userId);
  }

  async deleteByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<boolean> {
    return this.dao.deleteByUserAndProduct(userId, productId);
  }
}
