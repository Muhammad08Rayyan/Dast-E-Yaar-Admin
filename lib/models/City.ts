import mongoose, { Document, Schema } from 'mongoose';

export interface ICity extends Document {
  name: string;
  distributor_channel: 'pillbox' | 'other';
  distributor_id?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const CitySchema = new Schema<ICity>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    distributor_channel: {
      type: String,
      enum: ['pillbox', 'other'],
      required: true,
    },
    distributor_id: {
      type: Schema.Types.ObjectId,
      ref: 'Distributor',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
CitySchema.index({ name: 1 });
CitySchema.index({ status: 1 });
CitySchema.index({ distributor_channel: 1 });

export default mongoose.models.City || mongoose.model<ICity>('City', CitySchema);
