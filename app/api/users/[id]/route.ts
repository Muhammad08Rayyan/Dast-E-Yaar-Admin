import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/models/User';
import District from '@/lib/models/District';
import { successResponse, errorResponse } from '@/lib/utils/response';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// GET /api/users/:id - Get user details
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user ID', 400);
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('assigned_district', 'name code');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse({ user });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return errorResponse(error.message || 'Failed to fetch user');
  }
}

// PUT /api/users/:id - Update user
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user ID', 400);
    }

    const body = await request.json();
    const { email, password, name, role, assigned_district, status } = body;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Check if email is being changed and if it's already taken
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return errorResponse('Email already exists', 400);
      }
      user.email = email.toLowerCase();
    }

    // Update fields
    if (name) user.name = name;
    if (role && ['super_admin', 'kam'].includes(role)) {
      user.role = role;
    }
    if (assigned_district !== undefined) {
      user.assigned_district = role === 'kam' ? assigned_district : null;
    }
    if (status && ['active', 'inactive'].includes(status)) {
      user.status = status;
    }

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Populate district and remove password from response
    const updatedUser = await User.findById(id)
      .select('-password')
      .populate('assigned_district', 'name code');

    return successResponse({ user: updatedUser }, 'User updated successfully');
  } catch (error: any) {
    console.error('Error updating user:', error);
    return errorResponse(error.message || 'Failed to update user');
  }
}

// DELETE /api/users/:id - Delete user permanently
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid user ID', 400);
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(null, 'User deleted successfully');
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return errorResponse(error.message || 'Failed to delete user');
  }
}

