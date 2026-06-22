// src/products/controllers/products.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
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
    @Request() req: { user: { userId: string } },
  ) {
    return this.productsService.create(req.user.userId, createProductDto);
  }

  @Get('mine')
  async findMine(@Request() req: { user: { userId: string } }) {
    return this.productsService.findMine(req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.productsService.update(id, req.user.userId, updateProductDto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.productsService.delete(id, req.user.userId);
  }
}