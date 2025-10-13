import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITeam extends Document {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
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

// Index for efficient queries
TeamSchema.index({ status: 1 });

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

export default Team;

