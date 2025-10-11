import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import District from '@/lib/models/District';
import Distributor from '@/lib/models/Distributor';
import { successResponse, errorResponse } from '@/lib/utils/response';

// PUT /api/districts/[id]/cities/[cityId] - Update city in district (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cityId: string }> }
) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { id, cityId } = await params;

    const body = await request.json();
    const { name, distributor_channel, distributor_id } = body;

    const district = await District.findById(id);
    if (!district) {
      return errorResponse('District not found', 404);
    }

    const city = (district.cities as any).id(cityId);
    if (!city) {
      return errorResponse('City not found', 404);
    }

    // Validate distributor_channel
    if (distributor_channel && !['pillbox', 'local'].includes(distributor_channel)) {
      return errorResponse('distributor_channel must be either "pillbox" or "local"', 400);
    }

    // Verify distributor if changing to local or updating distributor_id
    if ((distributor_channel === 'local' || city.distributor_channel === 'local') && distributor_id) {
      const distributor = await Distributor.findById(distributor_id);
      if (!distributor) {
        return errorResponse('Distributor not found', 404);
      }

      if (distributor.status !== 'active') {
        return errorResponse('Cannot assign an inactive distributor', 400);
      }
    }

    // Update city fields
    if (name) city.name = name.trim();
    if (distributor_channel) {
      city.distributor_channel = distributor_channel;
      if (distributor_channel === 'pillbox') {
        city.distributor_id = undefined;
      }
    }
    if (distributor_id !== undefined) {
      city.distributor_id = distributor_id || undefined;
    }

    await district.save();

    return successResponse(
      { cities: district.cities },
      'City updated successfully'
    );
  } catch (error: any) {
    console.error('Error updating city:', error);
    return errorResponse(error.message || 'Failed to update city');
  }
}

// DELETE /api/districts/[id]/cities/[cityId] - Delete city from district (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cityId: string }> }
) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { id, cityId } = await params;

    const district = await District.findById(id);
    if (!district) {
      return errorResponse('District not found', 404);
    }

    const city = (district.cities as any).id(cityId);
    if (!city) {
      return errorResponse('City not found', 404);
    }

    // Remove city
    city.deleteOne();
    await district.save();

    return successResponse(
      { cities: district.cities },
      'City deleted successfully'
    );
  } catch (error: any) {
    console.error('Error deleting city:', error);
    return errorResponse(error.message || 'Failed to delete city');
  }
}
