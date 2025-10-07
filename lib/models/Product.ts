import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  shopify_product_id?: string;
  shopify_variant_id?: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    shopify_product_id: {
      type: String,
    },
    shopify_variant_id: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;

