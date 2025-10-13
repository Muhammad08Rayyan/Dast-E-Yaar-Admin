import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/utils/response';
import bcrypt from 'bcryptjs';

// GET /api/users - List all users (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }
    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .select('-password')
      .populate('district_id', 'name code')
      .populate('team_id', 'name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return successResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return errorResponse(error.message || 'Failed to fetch users');
  }
}

// POST /api/users - Create new user (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const body = await request.json();
    const { email, password, name, role, district_id, team_id, status } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return errorResponse('Email, password, name, and role are required', 400);
    }

    // For KAM role, both district and team are required
    if (role === 'kam' && (!district_id || !team_id)) {
      return errorResponse('Both district and team are required for KAM role', 400);
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse('Email already exists', 400);
    }

    // Validate role
    if (!['super_admin', 'kam'].includes(role)) {
      return errorResponse('Invalid role. Must be super_admin or kam', 400);
    }

    // If KAM, verify district and team exist and check for existing KAM in same district+team combination
    if (role === 'kam' && district_id && team_id) {
      const District = (await import('@/lib/models/District')).default;
      const Team = (await import('@/lib/models/Team')).default;
      
      const district = await District.findById(district_id);
      if (!district) {
        return errorResponse('District not found', 404);
      }

      const team = await Team.findById(team_id);
      if (!team) {
        return errorResponse('Team not found', 404);
      }

      // Check if this district+team combination already has a KAM
      const existingKam = await User.findOne({ 
        district_id, 
        team_id, 
        role: 'kam', 
        status: 'active' 
      });
      if (existingKam) {
        return errorResponse(
          `District "${district.name}" with Team "${team.name}" already has an active KAM assigned (${existingKam.name})`, 
          400
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      district_id: role === 'kam' ? district_id : null,
      team_id: role === 'kam' ? team_id : null,
      status: status || 'active'
    });

    // If KAM, update all doctors in this district+team combination with the new KAM
    if (role === 'kam' && district_id && team_id) {
      const Doctor = (await import('@/lib/models/Doctor')).default;
      await Doctor.updateMany(
        { district_id: district_id, team_id: team_id },
        { kam_id: user._id }
      );
    }

    // Populate district and team, remove password from response
    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('district_id', 'name code')
      .populate('team_id', 'name');

    return successResponse(
      { user: populatedUser },
      'User created successfully',
      201
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    return errorResponse(error.message || 'Failed to create user');
  }
}

