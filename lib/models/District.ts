import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDistrict extends Document {
  _id: string;
  name: string;
  code: string;
  kam_id: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const DistrictSchema = new Schema<IDistrict>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    kam_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

const District: Model<IDistrict> = mongoose.models.District || mongoose.model<IDistrict>('District', DistrictSchema);

export default District;

