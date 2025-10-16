import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Prescription from '@/lib/models/Prescription';
import Order from '@/lib/models/Order';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// GET /api/prescriptions/:id - Get prescription details (Super Admin only)
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
      return errorResponse('Invalid prescription ID', 400);
    }

    const prescription = await Prescription.findById(id)
      .populate('patient_id', 'name mrn phone age gender city address')
      .populate({
        path: 'doctor_id',
        select: 'name email phone pmdc_number specialty',
        populate: {
          path: 'district_id',
          select: 'name code',
        },
      })
      .populate('district_id', 'name code');

    if (!prescription) {
      return errorResponse('Prescription not found', 404);
    }

    // Get related order if exists
    let order = null;
    if (prescription.shopify_order_id) {
      order = await Order.findOne({ prescription_id: id })
        .populate('doctor_info.district_id', 'name code');
    }

    return successResponse({
      prescription,
      order,
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch prescription');
  }
}

