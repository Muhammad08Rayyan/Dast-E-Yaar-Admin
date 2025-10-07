import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/connection';
import User from '@/lib/models/User';
import { withAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse } from '@/lib/utils/response';

async function handler(req: NextRequest & { user?: any }) {
  try {
    await connectDB();

    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('assigned_district', 'name code');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      assigned_district: user.assigned_district,
      status: user.status,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return errorResponse('An error occurred', 500);
  }
}

export const GET = withAuth(handler);

