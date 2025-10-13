import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITeamProduct extends Document {
  _id: string;
  team_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const TeamProductSchema = new Schema<ITeamProduct>(
  {
    team_id: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
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

// Ensure unique combination of team and product
TeamProductSchema.index({ team_id: 1, product_id: 1 }, { unique: true });

// Index for efficient queries
TeamProductSchema.index({ team_id: 1, status: 1 });
TeamProductSchema.index({ product_id: 1, status: 1 });

const TeamProduct: Model<ITeamProduct> = mongoose.models.TeamProduct || mongoose.model<ITeamProduct>('TeamProduct', TeamProductSchema);

export default TeamProduct;