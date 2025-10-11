import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOrder extends Document {
  _id: string;
  prescription_id: mongoose.Types.ObjectId;
  shopify_order_id: string;
  shopify_order_number: string;
  patient_info: {
    mrn: string;
    name: string;
    phone: string;
    address?: string;
    city_id?: mongoose.Types.ObjectId;
    city_name?: string;
  };
  doctor_info: {
    doctor_id: mongoose.Types.ObjectId;
    name: string;
    district_id: mongoose.Types.ObjectId;
  };
  order_status: 'pending' | 'processing' | 'fulfilled' | 'cancelled';
  financial_status: 'pending' | 'paid' | 'refunded';
  fulfillment_status: 'unfulfilled' | 'fulfilled' | 'partial';
  tracking_number?: string;
  tracking_url?: string;
  total_amount: number;
  currency: string;
  shopify_created_at?: Date;
  shopify_updated_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    prescription_id: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
    },
    shopify_order_id: {
      type: String,
      required: true,
    },
    shopify_order_number: {
      type: String,
      required: true,
    },
    patient_info: {
      mrn: String,
      name: String,
      phone: String,
      address: String,
      city_id: {
        type: Schema.Types.ObjectId,
        ref: 'City',
      },
      city_name: String,
    },
    doctor_info: {
      doctor_id: {
        type: Schema.Types.ObjectId,
        ref: 'Doctor',
      },
      name: String,
      district_id: {
        type: Schema.Types.ObjectId,
        ref: 'District',
      },
    },
    order_status: {
      type: String,
      enum: ['pending', 'processing', 'fulfilled', 'cancelled'],
      default: 'pending',
    },
    financial_status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    fulfillment_status: {
      type: String,
      enum: ['unfulfilled', 'fulfilled', 'partial'],
      default: 'unfulfilled',
    },
    tracking_number: String,
    tracking_url: String,
    total_amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'PKR',
    },
    shopify_created_at: Date,
    shopify_updated_at: Date,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;

