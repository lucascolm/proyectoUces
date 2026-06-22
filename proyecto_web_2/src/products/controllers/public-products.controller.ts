// src/products/controllers/public-products.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { ProductsService } from '../services/products.service';

@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() query: ListProductsQueryDto) {
    return this.productsService.findPublic(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.productsService.findPublicById(id);
  }
}