import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import District from '@/lib/models/District';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// PATCH /api/districts/:id/status - Toggle district status (Super Admin only)
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
      return errorResponse('Invalid district ID', 400);
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return errorResponse('Invalid status. Must be active or inactive', 400);
    }

    const district = await District.findById(id);
    if (!district) {
      return errorResponse('District not found', 404);
    }

    district.status = status;
    await district.save();

    const updatedDistrict = await District.findById(id)
      .populate('kam_id', 'name email');

    return successResponse(
      { district: updatedDistrict },
      `District ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error: any) {
    console.error('Error updating district status:', error);
    return errorResponse(error.message || 'Failed to update district status');
  }
}

