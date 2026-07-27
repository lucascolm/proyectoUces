// src/promotions/controllers/promotions.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../users/guards/jwt-auth.guard';
import { Role } from '../constants/roles.enum';
import { Roles } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';
import { PromotionsService } from '../services/promotions.service';


type AuthenticatedRequest = { user: { userId: string; role: Role } };

@Controller('promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @Roles(Role.SELLER, Role.ADMIN)
  async create(@Body() dto: CreateCouponDto, @Request() req: AuthenticatedRequest) {
    return this.promotionsService.create(req.user.userId, dto);
  }

  @Post('validate')
  async validate(@Body() dto: ValidateCouponDto, @Request() req: AuthenticatedRequest) {
    return this.promotionsService.validate(req.user.userId, dto);
  }

  @Get('mine')
  @Roles(Role.SELLER, Role.ADMIN)
  async findMine(@Request() req: AuthenticatedRequest) {
    return this.promotionsService.findMine(req.user.userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.promotionsService.delete(id, req.user.userId, req.user.role);
  }
}