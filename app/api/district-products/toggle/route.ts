import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import DistrictProduct from '@/lib/models/DistrictProduct';
import Product from '@/lib/models/Product';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// DEPRECATED: District-product assignment feature has been removed.
// All products are now available to all doctors regardless of district.
// This endpoint is kept for backward compatibility but does nothing.
// POST /api/district-products/toggle - Toggle product availability for district
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['kam']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const districtId = authResult.user?.assigned_district;
    if (!districtId) {
      return errorResponse('No district assigned to this KAM', 400);
    }

    const body = await request.json();
    const { product_id, status } = body;

    // Validate input
    if (!product_id) {
      return errorResponse('Product ID is required', 400);
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return errorResponse('Valid status is required (active or inactive)', 400);
    }

    // Verify product exists
    const product = await Product.findById(product_id);
    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Check if district product entry exists
    let districtProduct = await DistrictProduct.findOne({
      district_id: districtId,
      product_id: product_id,
    });

    const assignedBy = authResult.user?.userId 
      ? new mongoose.Types.ObjectId(authResult.user.userId) 
      : undefined;

    if (districtProduct) {
      // Update existing entry
      districtProduct.status = status;
      if (assignedBy) {
        districtProduct.assigned_by = assignedBy;
      }
      await districtProduct.save();
    } else {
      // Create new entry
      districtProduct = await DistrictProduct.create({
        district_id: districtId,
        product_id: product_id,
        status: status,
        assigned_by: assignedBy,
      });
    }

    const populatedDistrictProduct = await DistrictProduct.findById(districtProduct._id)
      .populate('product_id', 'name sku price')
      .populate('district_id', 'name code');

    return successResponse(
      { districtProduct: populatedDistrictProduct },
      `Product ${status === 'active' ? 'enabled' : 'disabled'} for your district`
    );
  } catch (error: any) {
    console.error('Error toggling district product:', error);
    return errorResponse(error.message || 'Failed to update product availability');
  }
}

