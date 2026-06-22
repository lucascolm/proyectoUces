// src/products/dao/products.mongoose.dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { Product } from '../schemas/product.schema';

type ProductPublicFilters = {
  isActive: boolean;
  category?: ListProductsQueryDto['category'];
  paymentOptions?: ListProductsQueryDto['paymentOption'];
  ownerId?: Types.ObjectId;
  price?: {
    $gte?: number;
    $lte?: number;
  };
};

export interface IProductsDao {
  create(productData: Partial<Product>): Promise<Product>;
  findPublic(query: ListProductsQueryDto): Promise<Product[]>;
  findPublicById(id: string): Promise<Product | null>;
  findById(id: string): Promise<Product | null>;
  findMine(ownerId: string): Promise<Product[]>;
  update(id: string, updateData: Partial<Product>): Promise<Product | null>;
  softDelete(id: string): Promise<Product | null>;
}

@Injectable()
export class ProductsMongooseDao implements IProductsDao {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async create(productData: Partial<Product>): Promise<Product> {
    const createdProduct = new this.productModel(productData);
    return createdProduct.save();
  }

  async findPublic(query: ListProductsQueryDto): Promise<Product[]> {
    const filters: ProductPublicFilters = { isActive: true };

    if (query.category) {
      filters.category = query.category;
    }

    if (query.paymentOption) {
      filters.paymentOptions = query.paymentOption;
    }

    if (query.ownerId) {
      filters.ownerId = new Types.ObjectId(query.ownerId);
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filters.price = {};

      if (query.minPrice !== undefined) {
        filters.price.$gte = query.minPrice;
      }

      if (query.maxPrice !== undefined) {
        filters.price.$lte = query.maxPrice;
      }
    }

    return this.productModel
      .find(filters as Record<string, unknown>)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPublicById(id: string): Promise<Product | null> {
    return this.productModel.findOne({ _id: id, isActive: true }).exec();
  }

  async findById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  async findMine(ownerId: string): Promise<Product[]> {
    return this.productModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    updateData: Partial<Product>,
  ): Promise<Product | null> {
    return this.productModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async softDelete(id: string): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
  }
}