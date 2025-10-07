import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import District from '@/lib/models/District';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// GET /api/districts/:id - Get district details
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
      return errorResponse('Invalid district ID', 400);
    }

    const district = await District.findById(id)
      .populate('kam_id', 'name email');

    if (!district) {
      return errorResponse('District not found', 404);
    }

    return successResponse({ district });
  } catch (error: any) {
    console.error('Error fetching district:', error);
    return errorResponse(error.message || 'Failed to fetch district');
  }
}

// PUT /api/districts/:id - Update district (Super Admin only)
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
      return errorResponse('Invalid district ID', 400);
    }

    const body = await request.json();
    const { name, code, kam_id, status } = body;

    const district = await District.findById(id);
    if (!district) {
      return errorResponse('District not found', 404);
    }

    // Check if code is being changed and if it's already taken
    if (code && code.toUpperCase() !== district.code) {
      const existingDistrict = await District.findOne({ code: code.toUpperCase() });
      if (existingDistrict) {
        return errorResponse('District code already exists', 400);
      }
      district.code = code.toUpperCase();
    }

    // Update fields
    if (name) district.name = name;
    if (kam_id !== undefined) district.kam_id = kam_id || null;
    if (status && ['active', 'inactive'].includes(status)) {
      district.status = status;
    }

    await district.save();

    const updatedDistrict = await District.findById(id)
      .populate('kam_id', 'name email');

    return successResponse(
      { district: updatedDistrict },
      'District updated successfully'
    );
  } catch (error: any) {
    console.error('Error updating district:', error);
    return errorResponse(error.message || 'Failed to update district');
  }
}

// DELETE /api/districts/:id - Delete district permanently (Super Admin only)
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
      return errorResponse('Invalid district ID', 400);
    }

    const district = await District.findByIdAndDelete(id);
    if (!district) {
      return errorResponse('District not found', 404);
    }

    return successResponse(null, 'District deleted successfully');
  } catch (error: any) {
    console.error('Error deleting district:', error);
    return errorResponse(error.message || 'Failed to delete district');
  }
}

