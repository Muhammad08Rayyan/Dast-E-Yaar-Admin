import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Order from '@/lib/models/Order';
import Prescription from '@/lib/models/Prescription';
import { successResponse, errorResponse } from '@/lib/utils/response';

// POST /api/orders/bulk-sync - Sync multiple orders from Shopify (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const body = await request.json();
    const { order_ids } = body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return errorResponse('order_ids array is required', 400);
    }

    // Fetch orders
    const orders = await Order.find({
      _id: { $in: order_ids },
    });

    if (orders.length === 0) {
      return successResponse({
        synced: 0,
        failed: 0,
        total: 0,
        orders: [],
        message: 'No orders found to sync',
      });
    }

    const shopifyApiUrl = process.env.SHOPIFY_STORE_URL;
    const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shopifyApiUrl || !shopifyAccessToken) {
      return errorResponse('Shopify configuration missing', 500);
    }

    let synced = 0;
    let failed = 0;
    const syncedOrders = [];

    for (const order of orders) {
      try {
        const shopifyOrderId = order.shopify_order_id;
        // Ensure URL has https:// protocol
        const fullShopifyUrl = shopifyApiUrl.startsWith('http') 
          ? shopifyApiUrl 
          : `https://${shopifyApiUrl}`;
        
        const response = await fetch(
          `${fullShopifyUrl}/admin/api/2024-01/orders/${shopifyOrderId}.json`,
          {
            headers: {
              'X-Shopify-Access-Token': shopifyAccessToken,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          failed++;
          continue;
        }

        const data = await response.json();
        const shopifyOrder = data.order;

        // Determine order status
        let orderStatus = 'pending';
        if (shopifyOrder.cancelled_at) {
          orderStatus = 'cancelled';
        } else if (shopifyOrder.fulfillment_status === 'fulfilled') {
          orderStatus = 'fulfilled';
        } else if (shopifyOrder.financial_status === 'paid') {
          orderStatus = 'processing';
        }

        // Extract tracking information
        let trackingNumber = order.tracking_number;
        let trackingUrl = order.tracking_url;

        if (shopifyOrder.fulfillments && shopifyOrder.fulfillments.length > 0) {
          const latestFulfillment = shopifyOrder.fulfillments[shopifyOrder.fulfillments.length - 1];
          trackingNumber = latestFulfillment.tracking_number || trackingNumber;
          trackingUrl = latestFulfillment.tracking_url || trackingUrl;
        }

        // Update order
        const updatedOrder = await Order.findByIdAndUpdate(
          order._id,
          {
            order_status: orderStatus,
            financial_status: shopifyOrder.financial_status,
            fulfillment_status: shopifyOrder.fulfillment_status || 'unfulfilled',
            tracking_number: trackingNumber,
            tracking_url: trackingUrl,
            total_amount: parseFloat(shopifyOrder.total_price || '0'),
            shopify_updated_at: new Date(shopifyOrder.updated_at),
            updated_at: new Date(),
          },
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

        // Update prescription status
        if (order.prescription_id) {
          await Prescription.findByIdAndUpdate(order.prescription_id, {
            order_status: orderStatus,
          });
        }

        syncedOrders.push(updatedOrder);
        synced++;
      } catch (error) {
        console.error(`Failed to sync order ${order._id}:`, error);
        failed++;
      }
    }

    return successResponse({
      synced,
      failed,
      total: orders.length,
      orders: syncedOrders,
      message: `Synced ${synced} out of ${orders.length} orders`,
    });
  } catch (error: any) {
    console.error('Error bulk syncing orders:', error);
    return errorResponse(error.message || 'Failed to bulk sync orders');
  }
}

