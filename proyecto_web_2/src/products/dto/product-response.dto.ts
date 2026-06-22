// src/products/dto/product-response.dto.ts
import { PaymentOption } from '../constants/payment-option.enum';
import { ProductCategory } from '../constants/product-category.enum';

export class ProductResponseDto {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  paymentOptions: PaymentOption[];
  imagesBase64: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProductResponseDto>) {
    Object.assign(this, partial);
  }
}