// src/products/dto/product-comment-response.dto.ts
export class ProductCommentAuthorDto {
  id: string;
  name: string;
  surname: string;
}

export class ProductCommentResponseDto {
  id: string;
  productId: string;
  authorId: string;
  message: string;
  author: ProductCommentAuthorDto;
  createdAt: Date;
  updatedAt: Date;
}