// src/promotions/dto/validate-coupon.dto.ts
import { IsMongoId, IsString } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  code: string;

  @IsMongoId()
  productId: string;
}