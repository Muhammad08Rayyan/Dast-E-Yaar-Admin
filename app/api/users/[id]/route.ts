import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/models/User';
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
      .populate('district_id', 'name code')
      .populate('team_id', 'name');

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
    const { email, password, name, role, district_id, team_id, status } = body;

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

    // Handle district and team assignment for KAM
    const oldDistrictId = user.district_id?.toString();
    const oldTeamId = user.team_id?.toString();
    
    if (district_id !== undefined || team_id !== undefined) {
      // For KAM, both district and team are required
      if (role === 'kam' && (!district_id || !team_id)) {
        return errorResponse('Both district and team are required for KAM role', 400);
      }
      
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

        // Check if another KAM is already assigned to this district+team combination
        const existingKam = await User.findOne({
          district_id,
          team_id,
          role: 'kam',
          status: 'active',
          _id: { $ne: id } // Exclude current user
        });
        if (existingKam) {
          return errorResponse(
            `District "${district.name}" with Team "${team.name}" already has an active KAM assigned (${existingKam.name})`, 
            400
          );
        }
      }
      
      user.district_id = role === 'kam' ? district_id : null;
      user.team_id = role === 'kam' ? team_id : null;
    }

    if (status && ['active', 'inactive'].includes(status)) {
      user.status = status;
    }

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // If district or team changed and user is KAM, update all doctors in the new district+team combination
    const newDistrictId = user.district_id?.toString();
    const newTeamId = user.team_id?.toString();
    if (role === 'kam' && newDistrictId && newTeamId && 
        (newDistrictId !== oldDistrictId || newTeamId !== oldTeamId)) {
      const Doctor = (await import('@/lib/models/Doctor')).default;
      await Doctor.updateMany(
        { district_id: newDistrictId, team_id: newTeamId },
        { kam_id: user._id }
      );
    }

    // Populate district and team, remove password from response
    const updatedUser = await User.findById(id)
      .select('-password')
      .populate('district_id', 'name code')
      .populate('team_id', 'name');

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

