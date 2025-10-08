import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import { Team } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/teams/by-district/[districtId] - Get teams for a specific district
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ districtId: string }> }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { districtId } = await params;
    const teams = await Team.find({
      district_id: districtId,
      status: 'active'
    })
      .sort({ name: 1 });

    return successResponse({ teams });
  } catch (error: any) {
    console.error('Error fetching teams by district:', error);
    return errorResponse(error.message || 'Failed to fetch teams');
  }
}

