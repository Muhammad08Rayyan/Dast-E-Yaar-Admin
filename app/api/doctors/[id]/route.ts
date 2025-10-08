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
      // Get KAM's team
      const kamUser = await User.findById(authResult.user.userId);
      if (kamUser && kamUser.team_id) {
        // Check if doctor belongs to KAM's team
        if (doctor.team_id && doctor.team_id._id.toString() !== kamUser.team_id.toString()) {
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

    // If district is being changed, update district
    if (district_id && district_id !== doctor.district_id.toString()) {
      const newDistrict = await District.findById(district_id);
      if (!newDistrict) {
        return errorResponse('District not found', 404);
      }
      doctor.district_id = district_id;
    }

    // If team is being changed, auto-update KAM
    if (team_id && team_id !== doctor.team_id.toString()) {
      const newTeam = await Team.findById(team_id);
      if (!newTeam) {
        return errorResponse('Team not found', 404);
      }
      
      // Verify team belongs to doctor's district
      if (newTeam.district_id.toString() !== doctor.district_id.toString()) {
        return errorResponse('Team does not belong to doctor\'s district', 400);
      }
      
      // Find KAM assigned to this team
      const kam = await User.findOne({ team_id: team_id, role: 'kam', status: 'active' });
      if (!kam) {
        return errorResponse('No active KAM found for this team', 404);
      }
      
      doctor.team_id = new mongoose.Types.ObjectId(team_id);
      doctor.kam_id = new mongoose.Types.ObjectId(kam._id); // Auto-assign new KAM from team
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

