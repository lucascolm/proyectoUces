import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ProductCategory } from '../../products/constants/product-category.enum';

export class CreateCouponDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'code must be alphanumeric' })
  code: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercentage: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @IsDateString()
  validUntil: string;

  @IsOptional()
  @IsEnum(ProductCategory)
  applicableCategory?: ProductCategory;

  @IsOptional()
  @IsMongoId()
  productId?: string;
}