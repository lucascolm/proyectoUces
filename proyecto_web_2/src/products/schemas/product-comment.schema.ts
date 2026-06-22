// src/products/schemas/product-comment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Product } from './product.schema';

@Schema({ timestamps: true })
export class ProductComment extends Document {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true, index: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  message: string;
}

export const ProductCommentSchema = SchemaFactory.createForClass(ProductComment);