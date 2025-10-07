import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Doctor from '@/lib/models/Doctor';
import District from '@/lib/models/District';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/utils/response';
import bcrypt from 'bcryptjs';

// GET /api/doctors - List doctors (with KAM scoping)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const district_id = searchParams.get('district_id') || '';
    const status = searchParams.get('status') || '';
    const specialty = searchParams.get('specialty') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    // KAM scoping: Only show doctors from assigned district
    if (authResult.user?.role === 'kam' && authResult.user?.assigned_district) {
      query.district_id = authResult.user.assigned_district;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { pmdc_number: { $regex: search, $options: 'i' } }
      ];
    }
    if (district_id) {
      query.district_id = district_id;
    }
    if (status) {
      query.status = status;
    }
    if (specialty) {
      query.specialty = { $regex: specialty, $options: 'i' };
    }

    const doctors = await Doctor.find(query)
      .select('-password')
      .populate('district_id', 'name code')
      .populate('kam_id', 'name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Doctor.countDocuments(query);

    return successResponse({
      doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    return errorResponse(error.message || 'Failed to fetch doctors');
  }
}

// POST /api/doctors - Create new doctor
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const body = await request.json();
    const { email, password, name, phone, pmdc_number, specialty } = body;
    let district_id = body.district_id;

    // KAM scoping: KAM can only create doctors in their own district
    if (authResult.user?.role === 'kam') {
      if (!authResult.user.assigned_district) {
        return errorResponse('You are not assigned to any district', 403);
      }
      district_id = authResult.user.assigned_district.toString();
    }

    // Validate required fields
    if (!email || !password || !name || !phone || !district_id || !pmdc_number || !specialty) {
      return errorResponse('All fields are required', 400);
    }

    // Check if email already exists
    const existingDoctor = await Doctor.findOne({ email: email.toLowerCase() });
    if (existingDoctor) {
      return errorResponse('Email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create doctor
    const doctor = await Doctor.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone,
      district_id,
      kam_id: authResult.user?.role === 'kam' ? authResult.user.userId : null,
      pmdc_number,
      specialty,
      status: 'active'
    });

    const populatedDoctor = await Doctor.findById(doctor._id)
      .select('-password')
      .populate('district_id', 'name code')
      .populate('kam_id', 'name email');

    return successResponse(
      { doctor: populatedDoctor },
      'Doctor created successfully',
      201
    );
  } catch (error: any) {
    console.error('Error creating doctor:', error);
    return errorResponse(error.message || 'Failed to create doctor');
  }
}

