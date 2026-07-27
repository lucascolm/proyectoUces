// src/promotions/schemas/coupon.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Product } from '../../products/schemas/product.schema';
import { ProductCategory } from '../../products/constants/product-category.enum';

@Schema({ timestamps: true })
export class Coupon extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ required: true, min: 1, max: 100 })
  discountPercentage: number;

  @Prop({ type: Number, min: 1, default: null })
  maxUses: number | null;

  @Prop({ default: 0 })
  usesCount: number;

  @Prop({ required: true })
  validUntil: Date;

  @Prop({ type: String, enum: ProductCategory, default: null })
  applicableCategory: ProductCategory | null;

  @Prop({ type: Types.ObjectId, ref: Product.name, default: null, index: true })
  productId: Types.ObjectId | null;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

// code único por vendedor (dos vendedores distintos pueden tener el mismo code)
CouponSchema.index({ ownerId: 1, code: 1 }, { unique: true });