import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Patient from '@/lib/models/Patient';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/patients - List all patients (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const gender = searchParams.get('gender') || '';
    const city = searchParams.get('city') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mrn: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (gender) {
      query.gender = gender;
    }
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    const patients = await Patient.find(query)
      .populate('created_by', 'name email phone specialty')
      .sort({ mrn: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Patient.countDocuments(query);

    return successResponse({
      patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch patients');
  }
}

