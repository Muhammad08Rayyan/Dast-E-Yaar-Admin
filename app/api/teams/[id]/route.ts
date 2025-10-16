import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import { Team, Doctor, Prescription } from '@/lib/models';
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
    const team = await Team.findById(id);

    if (!team) {
      return errorResponse('Team not found', 404);
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
      stats: {
        doctors: doctors.length,
        prescriptions: prescriptionCount
      },
      doctors: doctors
    };

    return successResponse({ team: teamData });
  } catch (error: any) {
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
    const { name, description, status } = body;

    const team = await Team.findById(id);
    if (!team) {
      return errorResponse('Team not found', 404);
    }

    // Update team
    team.name = name || team.name;
    team.description = description !== undefined ? description : team.description;
    team.status = status || team.status;

    await team.save();

    const updatedTeam = await Team.findById(team._id);

    return successResponse(
      { team: updatedTeam },
      'Team updated successfully'
    );
  } catch (error: any) {
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
        `Cannot delete team. Please reassign or delete all ${doctorsCount} assigned doctor(s) first.`,
        400
      );
    }

    await Team.findByIdAndDelete(id);

    return successResponse(null, 'Team deleted successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete team');
  }
}

