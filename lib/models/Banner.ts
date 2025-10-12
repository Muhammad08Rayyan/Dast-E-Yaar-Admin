import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  description?: string;
  image_url: string;
  cloudinary_id: string;
  order: number;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    cloudinary_id: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
BannerSchema.index({ order: 1 });
BannerSchema.index({ is_active: 1 });

export default mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);
