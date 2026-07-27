// src/products/controllers/product-comments.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { ProductCommentsService } from '../services/product-comments.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductCommentsController {
  constructor(
    private readonly productCommentsService: ProductCommentsService,
  ) {}

  @Post(':id/comments')
  async create(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.productCommentsService.create(id, user.userId, createCommentDto);
  }

  @Get(':id/comments')
  async findByProductId(@Param('id') id: string) {
    return this.productCommentsService.findByProductId(id);
  }
}
