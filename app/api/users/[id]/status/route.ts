import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// PATCH /api/users/:id/status - Toggle user status
export async function PATCH(
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user ID', 400);
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return errorResponse('Invalid status. Must be active or inactive', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    user.status = status;
    await user.save();

    // Remove password from response and populate district
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('assigned_district', 'name code');

    return successResponse(
      { user: updatedUser },
      `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return errorResponse(error.message || 'Failed to update user status');
  }
}

