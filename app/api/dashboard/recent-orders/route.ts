import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import { Order } from '@/lib/models';
import { apiResponse } from '@/lib/utils/response';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        apiResponse(false, 'Unauthorized', null, { code: 'UNAUTHORIZED' }),
        { status: 401 }
      );
    }

    // Only super admin can view dashboard data
    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        apiResponse(false, 'Access denied', null, { code: 'FORBIDDEN' }),
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Get recent orders - patient_info is embedded, not a reference
    // Sort by order number descending (highest order number first)
    const recentOrders = await Order.find()
      .sort({ shopify_order_number: -1 })
      .limit(10)
      .select('shopify_order_number shopify_order_id order_status total_amount patient_info created_at')
      .lean();

    // Format the orders
    const orders = recentOrders.map((order: any) => ({
      id: order._id,
      orderNumber: order.shopify_order_number || 'N/A',
      shopifyOrderId: order.shopify_order_id || null,
      patient: {
        name: order.patient_info?.name || 'Unknown Patient',
        mrn: order.patient_info?.mrn || 'N/A',
        phone: order.patient_info?.phone || 'N/A',
      },
      status: order.order_status,
      totalAmount: order.total_amount || 0,
      createdAt: order.created_at,
    }));

    return NextResponse.json(
      apiResponse(true, 'Recent orders retrieved successfully', orders),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Dashboard recent orders error:', error);
    return NextResponse.json(
      apiResponse(false, 'Failed to fetch recent orders', null, {
        code: 'INTERNAL_ERROR',
        message: error.message,
      }),
      { status: 500 }
    );
  }
}

