import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Order from '@/lib/models/Order';
import Prescription from '@/lib/models/Prescription';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// POST /api/orders/:id/sync - Sync order status from Shopify (Super Admin and Distributors)
export async function POST(
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

    const order = await Order.findById(id);

    if (!order) {
      return errorResponse('Order not found', 404);
    }

    // Check if this is a non-Shopify order (LOCAL orders)
    if (order.shopify_order_id?.startsWith('LOCAL-')) {
      // Non-Shopify orders don't need syncing, return current data
      const currentOrder = await Order.findById(id)
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
        order: currentOrder,
        message: 'Non-Shopify order - no sync needed',
      });
    }

    // Fetch latest status from Shopify
    try {
      const shopifyApiUrl = process.env.SHOPIFY_STORE_URL;
      const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;

      if (!shopifyApiUrl || !shopifyAccessToken) {
        return errorResponse('Shopify configuration missing', 500);
      }

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
        throw new Error(`Shopify API error: ${response.statusText}`);
      }

      const data = await response.json();
      const shopifyOrder = data.order;

      // Determine order status based on Shopify data
      let orderStatus = 'pending';
      if (shopifyOrder.cancelled_at) {
        orderStatus = 'cancelled';
      } else if (shopifyOrder.fulfillment_status === 'fulfilled') {
        orderStatus = 'fulfilled';
      } else if (shopifyOrder.financial_status === 'paid') {
        orderStatus = 'processing';
      }

      // Extract tracking information from fulfillments
      let trackingNumber = order.tracking_number;
      let trackingUrl = order.tracking_url;

      if (shopifyOrder.fulfillments && shopifyOrder.fulfillments.length > 0) {
        const latestFulfillment = shopifyOrder.fulfillments[shopifyOrder.fulfillments.length - 1];
        trackingNumber = latestFulfillment.tracking_number || trackingNumber;
        trackingUrl = latestFulfillment.tracking_url || trackingUrl;
      }

      // Update order in database
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
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

      // Also update prescription status
      if (order.prescription_id) {
        await Prescription.findByIdAndUpdate(order.prescription_id, {
          order_status: orderStatus,
        });
      }

      return successResponse({
        order: updatedOrder,
        message: 'Order status synced successfully from Shopify',
      });
    } catch (shopifyError: any) {

      // Return current order data if Shopify sync fails
      const currentOrder = await Order.findById(id)
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
        order: currentOrder,
        message: 'Could not sync with Shopify, returning cached data',
        warning: shopifyError.message,
      });
    }
  } catch (error: any) {

    return errorResponse(error.message || 'Failed to sync order');
  }
}

