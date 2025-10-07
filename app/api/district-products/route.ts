import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import DistrictProduct from '@/lib/models/DistrictProduct';
import { successResponse, errorResponse } from '@/lib/utils/response';

// DEPRECATED: District-product assignment feature has been removed.
// All products are now available to all doctors regardless of district.
// This endpoint is kept for backward compatibility but returns empty data.
// GET /api/district-products - Get all district products for the KAM's district
export async function GET(request: NextRequest) {
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

    // Fetch all district products for this district
    const districtProducts = await DistrictProduct.find({
      district_id: districtId,
    }).lean();

    // Transform the data to return product_id as string for easy matching
    const transformedProducts = districtProducts.map(dp => ({
      _id: dp._id.toString(),
      product_id: dp.product_id.toString(),
      status: dp.status,
      district_id: dp.district_id.toString(),
    }));

    return successResponse({ districtProducts: transformedProducts });
  } catch (error: any) {
    console.error('Error fetching district products:', error);
    return errorResponse(error.message || 'Failed to fetch district products');
  }
}

