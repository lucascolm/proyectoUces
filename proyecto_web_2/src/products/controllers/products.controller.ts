// src/products/controllers/products.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductsService } from '../services/products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.productsService.create(user.userId, createProductDto);
  }

  @Get('mine')
  async findMine(@CurrentUser() user: JwtUserPayload) {
    return this.productsService.findMine(user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.productsService.update(id, user.userId, updateProductDto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.productsService.delete(id, user.userId);
  }
}
