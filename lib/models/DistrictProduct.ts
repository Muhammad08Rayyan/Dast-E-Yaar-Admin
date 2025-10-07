import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDistrictProduct extends Document {
  _id: string;
  district_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  assigned_at: Date;
  assigned_by: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
}

const DistrictProductSchema = new Schema<IDistrictProduct>({
  district_id: {
    type: Schema.Types.ObjectId,
    ref: 'District',
    required: true,
  },
  product_id: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  assigned_at: {
    type: Date,
    default: Date.now,
  },
  assigned_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
});

// Compound unique index
DistrictProductSchema.index({ district_id: 1, product_id: 1 }, { unique: true });

const DistrictProduct: Model<IDistrictProduct> = 
  mongoose.models.DistrictProduct || mongoose.model<IDistrictProduct>('DistrictProduct', DistrictProductSchema);

export default DistrictProduct;

