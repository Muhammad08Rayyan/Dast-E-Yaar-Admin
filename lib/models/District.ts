import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICity {
  _id?: string;
  name: string;
  distributor_channel: 'pillbox' | 'local';
  distributor_id?: string;
}

export interface IDistrict extends Document {
  _id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
  cities: ICity[];
  created_at: Date;
  updated_at: Date;
}

const CitySchema = new Schema<ICity>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  distributor_channel: {
    type: String,
    enum: ['pillbox', 'local'],
    required: true,
  },
  distributor_id: {
    type: String,
    ref: 'Distributor',
  },
});

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
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    cities: [CitySchema],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const District: Model<IDistrict> = mongoose.models.District || mongoose.model<IDistrict>('District', DistrictSchema);

export default District;

