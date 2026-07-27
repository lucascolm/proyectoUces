// src/products/controllers/favorites.controller.ts
import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { FavoritesService } from '../services/favorites.service';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':productId')
  async create(
    @Param('productId') productId: string,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.favoritesService.create(user.userId, productId);
  }

  @Delete(':productId')
  async remove(
    @Param('productId') productId: string,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.favoritesService.remove(user.userId, productId);
  }

  @Get('me')
  async findMine(@CurrentUser() user: JwtUserPayload) {
    return this.favoritesService.findMine(user.userId);
  }
}
