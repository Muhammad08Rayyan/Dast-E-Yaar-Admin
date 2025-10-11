import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import District from '@/lib/models/District';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/cities/all - Get all cities across all districts
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const districts = await District.find({ status: 'active' }).select('name code cities');

    const allCities = districts.flatMap((district: any) =>
      district.cities.map((city: any) => ({
        cityName: city.name,
        districtId: district._id,
        districtName: district.name,
        districtCode: district.code,
        distributorChannel: city.distributor_channel,
        distributorId: city.distributor_id,
      }))
    );

    return successResponse({ cities: allCities });
  } catch (error: any) {
    console.error('Error fetching all cities:', error);
    return errorResponse(error.message || 'Failed to fetch cities');
  }
}
