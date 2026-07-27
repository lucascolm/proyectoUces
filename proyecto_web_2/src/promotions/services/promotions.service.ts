// src/promotions/services/promotions.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductsService } from '../../products/services/products.service';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';
import { CouponResponseDto } from '../dto/coupon-response.dto';
import type { ICouponsRepository } from '../repositories/coupons.repository';
import { Coupon } from '../schemas/coupon.schema';

@Injectable()
export class PromotionsService {
  constructor(
    @Inject('ICouponsRepository')
    private readonly couponsRepository: ICouponsRepository,
    private readonly productsService: ProductsService,
  ) {}

  async create(ownerId: string, dto: CreateCouponDto): Promise<CouponResponseDto> {
    const existing = await this.couponsRepository.findByOwnerAndCode(ownerId, dto.code);

    if (existing) {
      throw new ConflictException('Ya tienes un cupón con este código.');
    }

    if (new Date(dto.validUntil) <= new Date()) {
      throw new BadRequestException('validUntil must be a future date');
    }

    if (dto.productId) {
      // valida que el producto exista y sea del propio vendedor
      const product = await this.productsService.findOwnedEntityOrThrow(dto.productId, ownerId);
      if (dto.applicableCategory && dto.applicableCategory !== product.category) {
        throw new BadRequestException('applicableCategory does not match the product category');
      }
    }

    const coupon = await this.couponsRepository.create({
      ownerId: new Types.ObjectId(ownerId),
      code: dto.code.toUpperCase(),
      discountPercentage: dto.discountPercentage,
      maxUses: dto.maxUses ?? null,
      usesCount: 0,
      validUntil: new Date(dto.validUntil),
      applicableCategory: dto.applicableCategory ?? null,
      productId: dto.productId ? new Types.ObjectId(dto.productId) : null,
      isActive: true,
    });

    return this.toResponse(coupon);
  }

  async validate(buyerId: string, dto: ValidateCouponDto) {
    const coupon = await this.couponsRepository.findByCode(dto.code);

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (coupon.validUntil < new Date()) {
      throw new BadRequestException('Coupon expired');
    }

    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
      throw new BadRequestException('Coupon reached its usage limit');
    }

    const product = await this.productsService.findActiveEntityOrThrow(dto.productId);

    if (product.ownerId.toString() !== coupon.ownerId.toString()) {
      throw new BadRequestException('El cupon no es aplicables para este producto');
    }

    if (coupon.productId && coupon.productId.toString() !== dto.productId) {
      throw new BadRequestException('El cupon no es aplicables para este producto');
    }

    if (coupon.applicableCategory && coupon.applicableCategory !== product.category) {
      throw new BadRequestException('El cupon no es aplicables para esta categoria');
    }

    return {
      valid: true,
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      finalPrice: Number((product.price * (1 - coupon.discountPercentage / 100)).toFixed(2)),
    };
  }

  async findMine(ownerId: string): Promise<CouponResponseDto[]> {
    const coupons = await this.couponsRepository.findByOwnerId(ownerId);
    return coupons.map((coupon) => this.toResponse(coupon));
  }

  async delete(id: string, userId: string, role: string) {
    const coupon = await this.couponsRepository.findById(id);

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (coupon.ownerId.toString() !== userId && role !== 'admin') {
      throw new ForbiddenException('You do not own this coupon');
    }

    await this.couponsRepository.softDelete(id);

    return { message: 'Coupon deleted successfully' };
  }

  private toResponse(coupon: Coupon): CouponResponseDto {
    return new CouponResponseDto({
      id: coupon._id.toString(),
      ownerId: coupon.ownerId.toString(),
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
      maxUses: coupon.maxUses,
      usesCount: coupon.usesCount,
      validUntil: coupon.validUntil,
      applicableCategory: coupon.applicableCategory,
      productId: coupon.productId ? coupon.productId.toString() : null,
      isActive: coupon.isActive,
    });
  }
}