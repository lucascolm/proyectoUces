// src/promotions/repositories/coupons.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import type { ICouponsDao } from '../dao/coupons.mongoose.dao';
import { Coupon } from '../schemas/coupon.schema';

export interface ICouponsRepository {
  create(couponData: Partial<Coupon>): Promise<Coupon>;
  findById(id: string): Promise<Coupon | null>;
  findByOwnerAndCode(ownerId: string, code: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  findByOwnerId(ownerId: string): Promise<Coupon[]>;
  softDelete(id: string): Promise<Coupon | null>;
}

@Injectable()
export class CouponsRepository implements ICouponsRepository {
  constructor(
    @Inject('ICouponsDao')
    private readonly dao: ICouponsDao,
  ) {}

  create(couponData: Partial<Coupon>) {
    return this.dao.create(couponData);
  }
  findById(id: string) {
    return this.dao.findById(id);
  }
  findByOwnerAndCode(ownerId: string, code: string) {
    return this.dao.findByOwnerAndCode(ownerId, code);
  }
  findByCode(code: string) {
    return this.dao.findByCode(code);
  }
  findByOwnerId(ownerId: string) {
    return this.dao.findByOwnerId(ownerId);
  }
  softDelete(id: string) {
    return this.dao.softDelete(id);
  }
}