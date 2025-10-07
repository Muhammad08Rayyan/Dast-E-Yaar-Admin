import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IDoctor extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  district_id: mongoose.Types.ObjectId;
  kam_id: mongoose.Types.ObjectId;
  pmdc_number: string;
  specialty: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

const DoctorSchema = new Schema<IDoctor>(
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
    },
    district_id: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: true,
    },
    kam_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Auto-assigned based on district
    },
    pmdc_number: {
      type: String,
      required: true,
    },
    specialty: {
      type: String,
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

const Doctor: Model<IDoctor> = mongoose.models.Doctor || mongoose.model<IDoctor>('Doctor', DoctorSchema);

export default Doctor;

