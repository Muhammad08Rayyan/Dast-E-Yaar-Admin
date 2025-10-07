import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Doctor from '@/lib/models/Doctor';
import District from '@/lib/models/District';
import User from '@/lib/models/User';
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
      .populate('kam_id', 'name email');

    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    // KAM scoping: Check if KAM can access this doctor
    if (authResult.user?.role === 'kam') {
      if (!authResult.user.assigned_district || 
          authResult.user.assigned_district.toString() !== doctor.district_id._id.toString()) {
        return errorResponse('You do not have access to this doctor', 403);
      }
    }

    return successResponse({ doctor });
  } catch (error: any) {
    console.error('Error fetching doctor:', error);
    return errorResponse(error.message || 'Failed to fetch doctor');
  }
}

// PUT /api/doctors/:id - Update doctor
export async function PUT(
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
    const { email, password, name, phone, district_id, kam_id, pmdc_number, specialty, status } = body;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    // KAM scoping: Check if KAM can update this doctor
    if (authResult.user?.role === 'kam') {
      if (!authResult.user.assigned_district || 
          authResult.user.assigned_district.toString() !== doctor.district_id.toString()) {
        return errorResponse('You do not have access to this doctor', 403);
      }
      // KAM can't change district
      if (district_id && district_id !== doctor.district_id.toString()) {
        return errorResponse('You cannot change doctor district', 403);
      }
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
    if (district_id) doctor.district_id = district_id;
    if (kam_id !== undefined) doctor.kam_id = kam_id || null;
    if (pmdc_number) doctor.pmdc_number = pmdc_number;
    if (specialty) doctor.specialty = specialty;
    if (status && ['active', 'inactive'].includes(status)) {
      doctor.status = status;
    }

    // Update password if provided
    if (password) {
      doctor.password = await bcrypt.hash(password, 10);
    }

    await doctor.save();

    const updatedDoctor = await Doctor.findById(id)
      .select('-password')
      .populate('district_id', 'name code')
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

// DELETE /api/doctors/:id - Delete doctor permanently
export async function DELETE(
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

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    // KAM scoping: Check if KAM can delete this doctor
    if (authResult.user?.role === 'kam') {
      if (!authResult.user.assigned_district || 
          authResult.user.assigned_district.toString() !== doctor.district_id.toString()) {
        return errorResponse('You do not have access to this doctor', 403);
      }
    }

    // Permanently delete
    await Doctor.findByIdAndDelete(id);

    return successResponse(null, 'Doctor deleted successfully');
  } catch (error: any) {
    console.error('Error deleting doctor:', error);
    return errorResponse(error.message || 'Failed to delete doctor');
  }
}

