import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Doctor from '@/lib/models/Doctor';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// PATCH /api/doctors/:id/status - Toggle doctor status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid doctor ID', 400);
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return errorResponse('Invalid status. Must be active or inactive', 400);
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    // KAM scoping: Check if KAM can access this doctor
    if (authResult.user?.role === 'kam') {
      // Get KAM's team
      const kamUser = await User.findById(authResult.user.userId);
      if (kamUser && kamUser.team_id) {
        // Check if doctor belongs to KAM's team
        if (!doctor.team_id || doctor.team_id.toString() !== kamUser.team_id.toString()) {
          return errorResponse('You do not have access to this doctor', 403);
        }
      } else {
        return errorResponse('You do not have access to this doctor', 403);
      }
    }

    doctor.status = status;
    await doctor.save();

    const updatedDoctor = await Doctor.findById(id)
      .select('-password')
      .populate('district_id', 'name code')
      .populate('kam_id', 'name email');

    return successResponse(
      { doctor: updatedDoctor },
      `Doctor ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error: any) {
    console.error('Error updating doctor status:', error);
    return errorResponse(error.message || 'Failed to update doctor status');
  }
}

