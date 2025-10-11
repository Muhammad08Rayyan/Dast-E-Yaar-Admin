import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import District from '@/lib/models/District';
import Distributor from '@/lib/models/Distributor';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/districts/[id]/cities - Get all cities for a district (Super Admin only)
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

    const district = await District.findById(id).populate('cities.distributor_id', 'name email phone');

    if (!district) {
      return errorResponse('District not found', 404);
    }

    return successResponse({
      districtId: district._id,
      districtName: district.name,
      cities: district.cities
    });
  } catch (error: any) {
    console.error('Error fetching district cities:', error);
    return errorResponse(error.message || 'Failed to fetch cities');
  }
}

// POST /api/districts/[id]/cities - Add city to district (Super Admin only)
export async function POST(
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

    const body = await request.json();
    const { name, distributor_channel, distributor_id } = body;

    if (!name || !distributor_channel) {
      return errorResponse('City name and distributor_channel are required', 400);
    }

    if (!['pillbox', 'local'].includes(distributor_channel)) {
      return errorResponse('distributor_channel must be either "pillbox" or "local"', 400);
    }

    // If local channel, distributor_id is required
    if (distributor_channel === 'local' && !distributor_id) {
      return errorResponse('distributor_id is required for local distributor channel', 400);
    }

    // Verify distributor exists if provided
    if (distributor_id) {
      const distributor = await Distributor.findById(distributor_id);
      if (!distributor) {
        return errorResponse('Distributor not found', 404);
      }

      if (distributor.status !== 'active') {
        return errorResponse('Cannot assign an inactive distributor', 400);
      }
    }

    const district = await District.findById(id);
    if (!district) {
      return errorResponse('District not found', 404);
    }

    // Check if city already exists in this district
    const cityExists = district.cities.some((city: any) => city.name.toLowerCase() === name.toLowerCase());
    if (cityExists) {
      return errorResponse('City already exists in this district', 400);
    }

    // Add city
    district.cities.push({
      name: name.trim(),
      distributor_channel,
      distributor_id: distributor_channel === 'local' ? distributor_id : undefined,
    } as any);

    await district.save();

    return successResponse(
      { cities: district.cities },
      'City added successfully',
      201
    );
  } catch (error: any) {
    console.error('Error adding city:', error);
    return errorResponse(error.message || 'Failed to add city');
  }
}
