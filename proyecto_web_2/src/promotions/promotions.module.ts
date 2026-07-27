// src/promotions/promotions.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from '../products/products.module';
import { PromotionsController } from './controllers/promotions.controller';
import { CouponsMongooseDao } from './dao/coupons.mongoose.dao';
import { CouponsRepository } from './repositories/coupons.repository';
import { Coupon, CouponSchema } from './schemas/coupon.schema';
import { PromotionsService } from './services/promotions.service';

@Module({
  imports: [
    ProductsModule,
    MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }]),
  ],
  controllers: [PromotionsController],
  providers: [
    PromotionsService,
    { provide: 'ICouponsDao', useClass: CouponsMongooseDao },
    { provide: 'ICouponsRepository', useClass: CouponsRepository },
  ],
})
export class PromotionsModule {}