import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: 'super_admin' | 'kam';
  district_id: mongoose.Types.ObjectId | null;
  team_id: mongoose.Types.ObjectId | null; // For KAM: composite with district_id
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'kam'],
      required: true,
    },
    district_id: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      default: null,
    },
    team_id: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
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

// Prevent model recompilation in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

