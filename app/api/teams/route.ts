import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import { Team, Doctor, Prescription } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/teams - List all teams with statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }

    const teams = await Team.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    // Get statistics for each team
    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        const teamObj = team.toObject();
        
        // Count doctors in this team
        const doctorCount = await Doctor.countDocuments({ 
          team_id: team._id, 
          status: 'active' 
        });

        // Count prescriptions by doctors in this team
        const doctors = await Doctor.find({ team_id: team._id }).select('_id');
        const doctorIds = doctors.map(d => d._id);
        
        const prescriptionCount = await Prescription.countDocuments({
          doctor_id: { $in: doctorIds }
        });

        return {
          ...teamObj,
          stats: {
            doctors: doctorCount,
            prescriptions: prescriptionCount
          }
        };
      })
    );

    const total = await Team.countDocuments(query);

    return successResponse({
      teams: teamsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch teams');
  }
}

// POST /api/teams - Create new team (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const body = await request.json();
    const { name, description, status } = body;

    // Validate required fields
    if (!name) {
      return errorResponse('Name is required', 400);
    }

    // Create team
    const team = await Team.create({
      name,
      description: description || '',
      status: status || 'active'
    });

    return successResponse(
      { team },
      'Team created successfully',
      201
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to create team');
  }
}

