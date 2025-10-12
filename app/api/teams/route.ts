import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import { Team, User, District, Doctor, Prescription } from '@/lib/models';
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
    const districtId = searchParams.get('district_id') || '';
    // const kamId = searchParams.get('kam_id') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query - KAM users only see their own team
    const query: any = {};
    
    if (authResult.user?.role === 'kam') {
      // Get KAM's team
      const kamUser = await User.findById(authResult.user.userId);
      if (kamUser && kamUser.team_id) {
        query._id = kamUser.team_id;
      } else {
        // If KAM has no team, show no teams
        query._id = null;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }
    if (districtId) {
      query.district_id = districtId;
    }

    const teams = await Team.find(query)
      .populate('district_id', 'name code')
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

        // Get KAM assigned to this team
        const kam = await User.findOne({ team_id: team._id, role: 'kam', status: 'active' }).select('name email');

        return {
          ...teamObj,
          kam: kam || null,
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
    console.error('Error fetching teams:', error);
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
    const { name, description, district_id, status } = body;

    // Validate required fields
    if (!name || !district_id) {
      return errorResponse('Name and district are required', 400);
    }

    // Verify district exists
    const district = await District.findById(district_id);
    if (!district) {
      return errorResponse('District not found', 404);
    }

    // Create team
    const team = await Team.create({
      name,
      description: description || '',
      district_id,
      status: status || 'active'
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('district_id', 'name code');

    return successResponse(
      { team: populatedTeam },
      'Team created successfully',
      201
    );
  } catch (error: any) {
    console.error('Error creating team:', error);
    return errorResponse(error.message || 'Failed to create team');
  }
}

