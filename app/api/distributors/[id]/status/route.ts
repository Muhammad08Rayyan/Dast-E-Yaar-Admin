import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Distributor from '@/lib/models/Distributor';
import { successResponse, errorResponse } from '@/lib/utils/response';

// PATCH /api/distributors/[id]/status - Update distributor status (Super Admin only)
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

    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return errorResponse('Valid status (active or inactive) is required', 400);
    }

    const distributor = await Distributor.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-password');

    if (!distributor) {
      return errorResponse('Distributor not found', 404);
    }

    return successResponse(
      { distributor },
      `Distributor ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error: any) {

    return errorResponse(error.message || 'Failed to update distributor status');
  }
}
