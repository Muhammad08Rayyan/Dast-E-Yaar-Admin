import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Order from '@/lib/models/Order';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// GET /api/orders/:id - Get order details (Super Admin and Distributors)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authMiddleware(request, ['super_admin', 'distributor']);
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

    // Check if distributor is authorized to view this order
    if (authResult.user?.role === 'distributor' && authResult.user?.city_id) {
      const orderCityId = order.patient_info?.city_id?.toString();
      const userCityId = authResult.user.city_id.toString();

      if (orderCityId && orderCityId !== userCityId) {
        return errorResponse('Unauthorized to view this order', 403);
      }
    }

    return successResponse({ order });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch order');
  }
}

// PUT /api/orders/:id - Update order status (Super Admin and Distributors)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authMiddleware(request, ['super_admin', 'distributor']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid order ID', 400);
    }

    const body = await request.json();
    const { order_status, financial_status, fulfillment_status } = body;

    // Validate status values
    const validOrderStatuses = ['pending', 'processing', 'fulfilled', 'cancelled'];
    const validFinancialStatuses = ['pending', 'paid', 'refunded'];
    const validFulfillmentStatuses = ['unfulfilled', 'fulfilled', 'partial'];

    if (order_status && !validOrderStatuses.includes(order_status)) {
      return errorResponse('Invalid order status', 400);
    }
    if (financial_status && !validFinancialStatuses.includes(financial_status)) {
      return errorResponse('Invalid financial status', 400);
    }
    if (fulfillment_status && !validFulfillmentStatuses.includes(fulfillment_status)) {
      return errorResponse('Invalid fulfillment status', 400);
    }

    const order = await Order.findById(id);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Check if distributor is authorized to update this order
    if (authResult.user?.role === 'distributor' && authResult.user?.city_id) {
      const orderCityId = order.patient_info?.city_id?.toString();
      const userCityId = authResult.user.city_id.toString();

      if (orderCityId && orderCityId !== userCityId) {
        return errorResponse('Unauthorized to update this order', 403);
      }
    }

    // Update order with provided statuses
    const updateData: any = {};
    if (order_status) updateData.order_status = order_status;
    if (financial_status) updateData.financial_status = financial_status;
    if (fulfillment_status) updateData.fulfillment_status = fulfillment_status;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
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

    return successResponse({ 
      order: updatedOrder,
      message: 'Order status updated successfully'
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update order');
  }
}

