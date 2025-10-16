import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Prescription from '@/lib/models/Prescription';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/prescriptions - List all prescriptions (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const order_status = searchParams.get('order_status') || '';
    const priority = searchParams.get('priority') || '';
    const doctor_id = searchParams.get('doctor_id') || '';
    const district_id = searchParams.get('district_id') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { mrn: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } },
        { shopify_order_number: { $regex: search, $options: 'i' } },
      ];
    }
    if (order_status) {
      query.order_status = order_status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (doctor_id) {
      query.doctor_id = doctor_id;
    }
    if (district_id) {
      query.district_id = district_id;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient_id', 'name mrn phone age gender city')
      .populate('doctor_id', 'name email phone specialty')
      .populate('district_id', 'name code')
      .sort({ shopify_order_number: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Prescription.countDocuments(query);

    return successResponse({
      prescriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch prescriptions');
  }
}

