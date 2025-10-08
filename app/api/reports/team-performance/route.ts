import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import { Team, Doctor, Prescription, Order, User } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/reports/team-performance - Get team-wise performance (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const districtId = searchParams.get('districtId') || '';

    // Build date filter
    const dateFilter: any = {};
    if (dateFrom) {
      dateFilter.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = endDate;
    }

    // Get teams
    const teamQuery: any = { status: 'active' };
    if (districtId) {
      teamQuery.district_id = districtId;
    }

    const teams = await Team.find(teamQuery)
      .populate('district_id', 'name code');

    // Calculate performance for each team
    const teamPerformance = await Promise.all(
      teams.map(async (team) => {
        // Get doctors in this team
        const doctors = await Doctor.find({ team_id: team._id, status: 'active' });
        const doctorIds = doctors.map(d => d._id);

        // Build prescription query
        const prescriptionQuery: any = {
          doctor_id: { $in: doctorIds }
        };
        if (Object.keys(dateFilter).length > 0) {
          prescriptionQuery.createdAt = dateFilter;
        }

        // Get prescriptions
        const prescriptions = await Prescription.find(prescriptionQuery);
        const prescriptionIds = prescriptions.map(p => p._id);

        // Get orders
        const orders = await Order.find({
          prescription_id: { $in: prescriptionIds }
        });

        // Calculate metrics
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const fulfilledOrders = orders.filter(o => o.order_status === 'fulfilled').length;
        const fulfillmentRate = orders.length > 0 ? (fulfilledOrders / orders.length) * 100 : 0;

        // Find KAM for this team
        const teamKam = await User.findOne({ team_id: team._id, role: 'kam' });

        return {
          team: {
            _id: team._id,
            name: team.name,
            district: team.district_id,
            kam: teamKam ? { name: teamKam.name, email: teamKam.email } : null
          },
          stats: {
            doctors: doctors.length,
            prescriptions: prescriptions.length,
            orders: orders.length,
            revenue: Math.round(totalRevenue * 100) / 100,
            fulfillmentRate: Math.round(fulfillmentRate * 100) / 100
          }
        };
      })
    );

    // Sort by revenue descending
    teamPerformance.sort((a, b) => b.stats.revenue - a.stats.revenue);

    // Calculate totals
    const totals = teamPerformance.reduce(
      (acc, team) => ({
        doctors: acc.doctors + team.stats.doctors,
        prescriptions: acc.prescriptions + team.stats.prescriptions,
        orders: acc.orders + team.stats.orders,
        revenue: acc.revenue + team.stats.revenue
      }),
      { doctors: 0, prescriptions: 0, orders: 0, revenue: 0 }
    );

    return successResponse({
      teams: teamPerformance,
      totals,
      dateRange: {
        from: dateFrom || null,
        to: dateTo || null
      }
    });
  } catch (error: any) {
    console.error('Error generating team performance report:', error);
    return errorResponse(error.message || 'Failed to generate team performance report');
  }
}

