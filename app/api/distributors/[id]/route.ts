import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Distributor from '@/lib/models/Distributor';
import District from '@/lib/models/District';
import { successResponse, errorResponse } from '@/lib/utils/response';
import bcrypt from 'bcryptjs';

// GET /api/distributors/[id] - Get distributor by ID (Super Admin only)
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

    const distributor = await Distributor.findById(id).select('-password');

    if (!distributor) {
      return errorResponse('Distributor not found', 404);
    }

    // Get assigned cities
    const districts = await District.find({
      'cities.distributor_id': distributor._id,
    }).select('name code cities');

    const assignedCities = districts.flatMap((district: any) =>
      district.cities
        .filter((city: any) => city.distributor_id?.toString() === distributor._id.toString())
        .map((city: any) => ({
          cityName: city.name,
          districtName: district.name,
          districtCode: district.code,
        }))
    );

    return successResponse({
      distributor,
      assignedCities
    });
  } catch (error: any) {
    console.error('Error fetching distributor:', error);
    return errorResponse(error.message || 'Failed to fetch distributor');
  }
}

// PUT /api/distributors/[id] - Update distributor (Super Admin only)
export async function PUT(
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
    const { email, password, name, phone } = body;

    const distributor = await Distributor.findById(id);
    if (!distributor) {
      return errorResponse('Distributor not found', 404);
    }

    // Update fields
    if (name) distributor.name = name;
    if (phone) distributor.phone = phone;
    if (email) distributor.email = email.toLowerCase();
    if (password) {
      distributor.password = await bcrypt.hash(password, 10);
    }

    await distributor.save();

    // Remove password from response
    const distributorObj: any = distributor.toObject();
    delete distributorObj.password;

    return successResponse(
      { distributor: distributorObj },
      'Distributor updated successfully'
    );
  } catch (error: any) {
    console.error('Error updating distributor:', error);
    return errorResponse(error.message || 'Failed to update distributor');
  }
}

// DELETE /api/distributors/[id] - Delete distributor (Super Admin only)
export async function DELETE(
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

    const distributor = await Distributor.findById(id);
    if (!distributor) {
      return errorResponse('Distributor not found', 404);
    }

    // Check if distributor is assigned to any cities
    const assignedDistrict = await District.findOne({
      'cities.distributor_id': distributor._id,
    });

    if (assignedDistrict) {
      return errorResponse('Cannot delete distributor. They are assigned to one or more cities.', 400);
    }

    await distributor.deleteOne();

    return successResponse(
      null,
      'Distributor deleted successfully'
    );
  } catch (error: any) {
    console.error('Error deleting distributor:', error);
    return errorResponse(error.message || 'Failed to delete distributor');
  }
}
