import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPatient extends Document {
  _id: string;
  mrn: string;
  name: string;
  phone: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    mrn: {
      type: String,
      required: true,
      unique: true,
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
    age: Number,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    address: String,
    city: String,
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

export default Patient;

