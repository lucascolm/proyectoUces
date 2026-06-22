// src/products/dto/update-product.dto.ts
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { PaymentOption } from '../constants/payment-option.enum';
import { ProductCategory } from '../constants/product-category.enum';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price?: number;

  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(PaymentOption, { each: true })
  paymentOptions?: PaymentOption[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @Matches(/^(data:image\/[a-zA-Z0-9.+-]+;base64,)?[A-Za-z0-9+/]+=*$/, {
    each: true,
    message: 'Each image must be a valid base64 string',
  })
  imagesBase64?: string[];
}