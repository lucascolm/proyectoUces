// src/products/dto/favorite-response.dto.ts
import { ProductCategory } from '../constants/product-category.enum';

export class FavoriteResponseDto {
  favoriteId: string;
  productId: string;
  savedAt: Date;
  product: {
    id: string;
    name: string;
    price: number;
    category: ProductCategory;
    isActive: boolean;
  };
}
