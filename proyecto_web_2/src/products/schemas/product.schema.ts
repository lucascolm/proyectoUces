// src/products/schemas/product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { PaymentOption } from '../constants/payment-option.enum';
import { ProductCategory } from '../constants/product-category.enum';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, min: 0.01 })
  price: number;

  @Prop({
    type: String,
    enum: ProductCategory,
    required: true,
    index: true,
  })
  category: ProductCategory;

  @Prop({
    type: [String],
    enum: PaymentOption,
    required: true,
    default: [],
    index: true,
  })
  paymentOptions: PaymentOption[];

  @Prop({ type: [String], default: [] })
  imagesBase64: string[];

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);