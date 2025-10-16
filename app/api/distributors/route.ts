import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Distributor from '@/lib/models/Distributor';
import { successResponse, errorResponse } from '@/lib/utils/response';
import bcrypt from 'bcryptjs';

// GET /api/distributors - List all distributors (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }

    const distributors = await Distributor.find(query)
      .select('-password')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Distributor.countDocuments(query);

    return successResponse({
      distributors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch distributors');
  }
}

// POST /api/distributors - Create new distributor (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const body = await request.json();
    const { email, password, name, phone, status } = body;

    // Validate required fields
    if (!email || !password || !name || !phone) {
      return errorResponse('Email, password, name, and phone are required', 400);
    }

    // Check if email already exists
    const existingDistributor = await Distributor.findOne({ email: email.toLowerCase() });
    if (existingDistributor) {
      return errorResponse('Email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create distributor
    const distributor = await Distributor.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone,
      status: status || 'active'
    });

    // Remove password from response
    const distributorObj: any = distributor.toObject();
    delete distributorObj.password;

    return successResponse(
      { distributor: distributorObj },
      'Distributor created successfully',
      201
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create distributor');
  }
}
