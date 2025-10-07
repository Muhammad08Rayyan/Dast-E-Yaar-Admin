import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Order from '@/lib/models/Order';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/orders - List all orders (Super Admin only)
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
    const financial_status = searchParams.get('financial_status') || '';
    const fulfillment_status = searchParams.get('fulfillment_status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { 'patient_info.name': { $regex: search, $options: 'i' } },
        { 'patient_info.mrn': { $regex: search, $options: 'i' } },
        { 'patient_info.phone': { $regex: search, $options: 'i' } },
        { shopify_order_number: { $regex: search, $options: 'i' } },
        { 'doctor_info.name': { $regex: search, $options: 'i' } },
      ];
    }
    if (order_status) {
      query.order_status = order_status;
    }
    if (financial_status) {
      query.financial_status = financial_status;
    }
    if (fulfillment_status) {
      query.fulfillment_status = fulfillment_status;
    }

    const orders = await Order.find(query)
      .populate('prescription_id', 'prescription_text diagnosis priority')
      .populate('doctor_info.district_id', 'name code')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    return successResponse({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return errorResponse(error.message || 'Failed to fetch orders');
  }
}


