import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPrescription extends Document {
  _id: string;
  mrn: string;
  patient_id: mongoose.Types.ObjectId;
  doctor_id: mongoose.Types.ObjectId;
  district_id: mongoose.Types.ObjectId;
  prescription_text: string;
  prescription_files: string[];
  duration_days: number;
  priority: 'normal' | 'urgent' | 'emergency';
  selected_product?: {
    product_id: mongoose.Types.ObjectId;
    name: string;
    sku: string;
    price: number;
    quantity: number;
  };
  diagnosis?: string;
  notes?: string;
  shopify_order_id?: string;
  order_status: 'pending' | 'processing' | 'fulfilled' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

const PrescriptionSchema = new Schema<IPrescription>(
  {
    mrn: {
      type: String,
      required: true,
    },
    patient_id: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor_id: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    district_id: {
      type: Schema.Types.ObjectId,
      ref: 'District',
      required: true,
    },
    prescription_text: {
      type: String,
      required: true,
    },
    prescription_files: [String],
    duration_days: {
      type: Number,
      required: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'emergency'],
      default: 'normal',
    },
    selected_product: {
      product_id: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
      name: String,
      sku: String,
      price: Number,
      quantity: Number,
    },
    diagnosis: String,
    notes: String,
    shopify_order_id: String,
    order_status: {
      type: String,
      enum: ['pending', 'processing', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const Prescription: Model<IPrescription> = 
  mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);

export default Prescription;

