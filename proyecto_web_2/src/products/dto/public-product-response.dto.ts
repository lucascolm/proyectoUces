// src/products/dto/public-product-responde.dto.ts
import { ProductResponseDto } from './product-response.dto';

export class PublicProductOwnerDto {
  id: string;
  name: string;
  surname: string;
}

export class PublicProductResponseDto extends ProductResponseDto {
  owner: PublicProductOwnerDto;
}