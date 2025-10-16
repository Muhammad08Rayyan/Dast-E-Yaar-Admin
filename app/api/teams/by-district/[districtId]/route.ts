import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import { Team } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/teams/by-district/[districtId] - DEPRECATED: Teams are now independent of districts
// This route now returns all active teams for backwards compatibility
export async function GET(
  request: NextRequest
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    // Note: districtId parameter is ignored as teams are now independent of districts
    const teams = await Team.find({
      status: 'active'
    })
      .sort({ name: 1 });

    return successResponse({ teams });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch teams');
  }
}

