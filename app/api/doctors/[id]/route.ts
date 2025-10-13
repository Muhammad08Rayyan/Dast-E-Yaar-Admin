import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import { Doctor, District, Team, User } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/response';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// GET /api/doctors/:id - Get doctor details
export async function GET(
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

    const doctor = await Doctor.findById(id)
      .select('-password')
      .populate('district_id', 'name code')
      .populate('team_id', 'name')
      .populate('kam_id', 'name email');

    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    // KAM scoping: Check if KAM can access this doctor
    if (authResult.user?.role === 'kam') {
      // Get KAM's district and team
      const kamUser = await User.findById(authResult.user.userId);
      if (kamUser && kamUser.district_id && kamUser.team_id) {
        // Check if doctor belongs to KAM's district+team combination
        if (doctor.district_id && doctor.team_id && 
            (doctor.district_id._id.toString() !== kamUser.district_id.toString() ||
             doctor.team_id._id.toString() !== kamUser.team_id.toString())) {
          return errorResponse('You do not have access to this doctor', 403);
        }
      } else {
        return errorResponse('You do not have access to this doctor', 403);
      }
    }

    return successResponse({ doctor });
  } catch (error: any) {
    console.error('Error fetching doctor:', error);
    return errorResponse(error.message || 'Failed to fetch doctor');
  }
}

// PUT /api/doctors/:id - Update doctor (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    // Only Super Admin can update doctors
    if (authResult.user?.role !== 'super_admin') {
      return errorResponse('Only Super Admin can update doctors', 403);
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid doctor ID', 400);
    }

    const body = await request.json();
    const { email, password, name, phone, district_id, team_id, pmdc_number, specialty, status } = body;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    // Check if email is being changed and if it's already taken
    if (email && email.toLowerCase() !== doctor.email) {
      const existingDoctor = await Doctor.findOne({ email: email.toLowerCase() });
      if (existingDoctor) {
        return errorResponse('Email already exists', 400);
      }
      doctor.email = email.toLowerCase();
    }

    // Update fields
    if (name) doctor.name = name;
    if (phone) doctor.phone = phone;
    if (pmdc_number) doctor.pmdc_number = pmdc_number;
    if (specialty) doctor.specialty = specialty;
    if (status && ['active', 'inactive'].includes(status)) {
      doctor.status = status;
    }

    // If district or team is being changed, update and find new KAM
    const districtChanged = district_id && district_id !== doctor.district_id.toString();
    const teamChanged = team_id && team_id !== doctor.team_id.toString();
    
    if (districtChanged || teamChanged) {
      const newDistrictId = district_id || doctor.district_id.toString();
      const newTeamId = team_id || doctor.team_id.toString();
      
      const newDistrict = await District.findById(newDistrictId);
      if (!newDistrict) {
        return errorResponse('District not found', 404);
      }

      const newTeam = await Team.findById(newTeamId);
      if (!newTeam) {
        return errorResponse('Team not found', 404);
      }

      // Find KAM assigned to this district+team combination
      const kam = await User.findOne({ 
        district_id: newDistrictId, 
        team_id: newTeamId, 
        role: 'kam', 
        status: 'active' 
      });
      if (!kam) {
        return errorResponse(
          `No active KAM found for district "${newDistrict.name}" with team "${newTeam.name}"`, 
          404
        );
      }

      if (districtChanged) doctor.district_id = new mongoose.Types.ObjectId(newDistrictId);
      if (teamChanged) doctor.team_id = new mongoose.Types.ObjectId(newTeamId);
      doctor.kam_id = new mongoose.Types.ObjectId(kam._id); // Auto-assign new KAM from district+team combination
    }

    // Update password if provided
    if (password) {
      doctor.password = await bcrypt.hash(password, 10);
    }

    await doctor.save();

    const updatedDoctor = await Doctor.findById(id)
      .select('-password')
      .populate('district_id', 'name code')
      .populate('team_id', 'name')
      .populate('kam_id', 'name email');

    return successResponse(
      { doctor: updatedDoctor },
      'Doctor updated successfully'
    );
  } catch (error: any) {
    console.error('Error updating doctor:', error);
    return errorResponse(error.message || 'Failed to update doctor');
  }
}

// DELETE /api/doctors/:id - Delete doctor permanently (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    // Only Super Admin can delete doctors
    if (authResult.user?.role !== 'super_admin') {
      return errorResponse('Only Super Admin can delete doctors', 403);
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid doctor ID', 400);
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    // Permanently delete
    await Doctor.findByIdAndDelete(id);

    return successResponse(null, 'Doctor deleted successfully');
  } catch (error: any) {
    console.error('Error deleting doctor:', error);
    return errorResponse(error.message || 'Failed to delete doctor');
  }
}


