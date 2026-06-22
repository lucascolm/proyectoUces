// src/products/dto/list-products-query.dto.ts
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { PaymentOption } from '../constants/payment-option.enum';
import { ProductCategory } from '../constants/product-category.enum';

export class ListProductsQueryDto {
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @IsEnum(PaymentOption)
  paymentOption?: PaymentOption;

  @IsOptional()
  @IsMongoId()
  ownerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}