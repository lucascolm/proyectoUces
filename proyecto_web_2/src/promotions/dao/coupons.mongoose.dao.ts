// src/promotions/dao/coupons.mongoose.dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coupon } from '../schemas/coupon.schema';

export interface ICouponsDao {
  create(couponData: Partial<Coupon>): Promise<Coupon>;
  findById(id: string): Promise<Coupon | null>;
  findByOwnerAndCode(ownerId: string, code: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  findByOwnerId(ownerId: string): Promise<Coupon[]>;
  softDelete(id: string): Promise<Coupon | null>;
}

@Injectable()
export class CouponsMongooseDao implements ICouponsDao {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<Coupon>,
  ) {}

  async create(couponData: Partial<Coupon>): Promise<Coupon> {
    const coupon = new this.couponModel(couponData);
    return coupon.save();
  }

  async findById(id: string): Promise<Coupon | null> {
    return this.couponModel.findById(id).exec();
  }

  async findByOwnerAndCode(ownerId: string, code: string): Promise<Coupon | null> {
    return this.couponModel
      .findOne({ ownerId: new Types.ObjectId(ownerId), code: code.toUpperCase() })
      .exec();
  }

  async findByCode(code: string): Promise<Coupon | null> {
    // el codigo se ingresa sin saber el owner (lo tipea el comprador)
    return this.couponModel.findOne({ code: code.toUpperCase(), isActive: true }).exec();
  }

  async findByOwnerId(ownerId: string): Promise<Coupon[]> {
    return this.couponModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async softDelete(id: string): Promise<Coupon | null> {
    return this.couponModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
  }
}