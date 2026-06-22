// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { ProductsController } from './controllers/products.controller';
// import { PublicProductsController } from './controllers/public-products.controller';
import { ProductsMongooseDao } from './dao/products.mongoose.dao';
import { ProductsRepository } from './repositories/products.repository';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductsService } from './services/products.service';
import { PublicProductsController } from './controllers/public-products.controller';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  controllers: [ProductsController, PublicProductsController],
  providers: [
    ProductsService,
    {
      provide: 'IProductsDao',
      useClass: ProductsMongooseDao,
    },
    {
      provide: 'IProductsRepository',
      useClass: ProductsRepository,
    },
  ],
  exports: [ProductsService],
})
export class ProductsModule {}