import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IDistributor extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  city_id?: mongoose.Types.ObjectId;
  role: 'distributor';
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const DistributorSchema = new Schema<IDistributor>(
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
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    city_id: {
      type: Schema.Types.ObjectId,
      ref: 'City',
    },
    role: {
      type: String,
      default: 'distributor',
      immutable: true,
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

// Indexes
DistributorSchema.index({ email: 1 });
DistributorSchema.index({ city_id: 1 });
DistributorSchema.index({ status: 1 });

// Hash password before saving
DistributorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
DistributorSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const Distributor: Model<IDistributor> = mongoose.models.Distributor || mongoose.model<IDistributor>('Distributor', DistributorSchema);

export default Distributor;
