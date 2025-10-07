import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Order from '@/lib/models/Order';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// GET /api/orders/:id - Get order details (Super Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const order = await Order.findById(id)
      .populate({
        path: 'prescription_id',
        populate: [
          { path: 'patient_id', select: 'name mrn phone age gender city address' },
          { path: 'doctor_id', select: 'name email phone pmdc_number specialty' },
          { path: 'district_id', select: 'name code' },
        ],
      })
      .populate('doctor_info.doctor_id', 'name email phone pmdc_number specialty')
      .populate('doctor_info.district_id', 'name code');

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    return successResponse({ order });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return errorResponse(error.message || 'Failed to fetch order');
  }
}


