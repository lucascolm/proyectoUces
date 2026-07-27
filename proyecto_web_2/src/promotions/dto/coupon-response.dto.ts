import { ProductCategory } from '../../products/constants/product-category.enum';

export class CouponResponseDto {
  id: string;
  ownerId: string;
  code: string;
  discountPercentage: number;
  maxUses: number | null;
  usesCount: number;
  validUntil: Date;
  applicableCategory: ProductCategory | null;
  productId: string | null;
  isActive: boolean;

  constructor(partial: Partial<CouponResponseDto>) {
    Object.assign(this, partial);
  }
}