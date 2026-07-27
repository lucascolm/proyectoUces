// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { FavoritesController } from './controllers/favorites.controller';
import { ProductCommentsController } from './controllers/product-comments.controller';
import { ProductsController } from './controllers/products.controller';
import { PublicProductsController } from './controllers/public-products.controller';
import { FavoritesMongooseDao } from './dao/favorites.mongoose.dao';
import { ProductCommentsMongooseDao } from './dao/product-comments.mongoose.dao';
import { ProductsMongooseDao } from './dao/products.mongoose.dao';
import { FavoritesRepository } from './repositories/favorites.repository';
import { ProductCommentsRepository } from './repositories/product-comments.repository';
import { ProductsRepository } from './repositories/products.repository';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import {
  ProductComment,
  ProductCommentSchema,
} from './schemas/product-comment.schema';
import { Product, ProductSchema } from './schemas/product.schema';
import { FavoritesService } from './services/favorites.service';
import { ProductCommentsService } from './services/product-comments.service';
import { ProductsService } from './services/products.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductComment.name, schema: ProductCommentSchema },
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
  ],
  controllers: [
    ProductsController,
    PublicProductsController,
    ProductCommentsController,
    FavoritesController,
  ],
  providers: [
    ProductsService,
    ProductCommentsService,
    FavoritesService,
    {
      provide: 'IProductsDao',
      useClass: ProductsMongooseDao,
    },
    {
      provide: 'IProductsRepository',
      useClass: ProductsRepository,
    },
    {
      provide: 'IProductCommentsDao',
      useClass: ProductCommentsMongooseDao,
    },
    {
      provide: 'IProductCommentsRepository',
      useClass: ProductCommentsRepository,
    },
    {
      provide: 'IFavoritesDao',
      useClass: FavoritesMongooseDao,
    },
    {
      provide: 'IFavoritesRepository',
      useClass: FavoritesRepository,
    },
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
