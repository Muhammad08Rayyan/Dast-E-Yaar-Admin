import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import { Team, User, District, Doctor, Prescription } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/teams/[id] - Get single team with detailed statistics
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
    const team = await Team.findById(id)
      .populate('district_id', 'name code');

    if (!team) {
      return errorResponse('Team not found', 404);
    }

    // Get KAM assigned to this team
    const kam = await User.findOne({ team_id: team._id, role: 'kam', status: 'active' }).select('name email phone');

    // KAM users can only access their own team
    if (authResult.user?.role === 'kam' && authResult.user.team_id?.toString() !== team._id.toString()) {
      return errorResponse('Access denied', 403);
    }

    // Get detailed statistics
    const doctors = await Doctor.find({ team_id: team._id, status: 'active' })
      .select('_id name email specialty');
    
    const doctorIds = doctors.map(d => d._id);

    const prescriptionCount = await Prescription.countDocuments({
      doctor_id: { $in: doctorIds }
    });

    const teamData = {
      ...team.toObject(),
      kam: kam || null,
      stats: {
        doctors: doctors.length,
        prescriptions: prescriptionCount
      },
      doctors: doctors
    };

    return successResponse({ team: teamData });
  } catch (error: any) {
    console.error('Error fetching team:', error);
    return errorResponse(error.message || 'Failed to fetch team');
  }
}

// PUT /api/teams/[id] - Update team (Super Admin only)
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
    const body = await request.json();
    const { name, description, district_id, status } = body;

    const team = await Team.findById(id);
    if (!team) {
      return errorResponse('Team not found', 404);
    }

    // If district is being changed, verify it exists
    if (district_id && district_id !== team.district_id.toString()) {
      const district = await District.findById(district_id);
      if (!district) {
        return errorResponse('District not found', 404);
      }
    }

    // Update team
    team.name = name || team.name;
    team.description = description !== undefined ? description : team.description;
    team.district_id = district_id || team.district_id;
    team.status = status || team.status;

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('district_id', 'name code');

    return successResponse(
      { team: updatedTeam },
      'Team updated successfully'
    );
  } catch (error: any) {
    console.error('Error updating team:', error);
    return errorResponse(error.message || 'Failed to update team');
  }
}

// DELETE /api/teams/[id] - Delete team permanently (Super Admin only)
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
    const team = await Team.findById(id);
    if (!team) {
      return errorResponse('Team not found', 404);
    }

    // Check for assigned doctors
    const doctorsCount = await Doctor.countDocuments({ team_id: team._id });
    if (doctorsCount > 0) {
      return errorResponse(
        `Cannot delete team. Please delete all ${doctorsCount} assigned doctor(s) first.`,
        400
      );
    }

    // Check for assigned KAMs
    const kamsCount = await User.countDocuments({ team_id: team._id, role: 'kam' });
    if (kamsCount > 0) {
      return errorResponse(
        `Cannot delete team. Please delete all ${kamsCount} assigned KAM(s) first.`,
        400
      );
    }

    await Team.findByIdAndDelete(id);

    return successResponse(null, 'Team deleted successfully');
  } catch (error: any) {
    console.error('Error deleting team:', error);
    return errorResponse(error.message || 'Failed to delete team');
  }
}

