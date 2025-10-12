import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITeamProduct extends Document {
  _id: string;
  team_id: mongoose.Types.ObjectId;
  product_id: mongoose.Types.ObjectId;
  assigned_at: Date;
  assigned_by: mongoose.Types.ObjectId;
  status: 'active' | 'inactive';
}

const TeamProductSchema = new Schema<ITeamProduct>({
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
TeamProductSchema.index({ team_id: 1, product_id: 1 }, { unique: true });

const TeamProduct: Model<ITeamProduct> =
  mongoose.models.TeamProduct || mongoose.model<ITeamProduct>('TeamProduct', TeamProductSchema);

export default TeamProduct;
