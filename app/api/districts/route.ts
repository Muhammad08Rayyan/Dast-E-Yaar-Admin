import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import District from '@/lib/models/District';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/districts - List all districts
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }

    const districts = await District.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await District.countDocuments(query);

    return successResponse({
      districts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch districts');
  }
}

// POST /api/districts - Create new district (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const body = await request.json();
    const { name, code, status } = body;

    // Validate required fields
    if (!name || !code) {
      return errorResponse('Name and code are required', 400);
    }

    // Check if code already exists
    const existingDistrict = await District.findOne({ code: code.toUpperCase() });
    if (existingDistrict) {
      return errorResponse('District code already exists', 400);
    }

    // Create district
    const district = await District.create({
      name,
      code: code.toUpperCase(),
      status: status || 'active'
    });

    return successResponse(
      { district },
      'District created successfully',
      201
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create district');
  }
}

