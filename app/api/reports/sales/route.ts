import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import { Team, Doctor, Prescription, Order, User } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/reports/sales - Get sales report with role-based filtering
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const teamId = searchParams.get('teamId') || '';
    const districtId = searchParams.get('districtId') || '';

    console.log('Sales Report Filters:', { dateFrom, dateTo, teamId, districtId });

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
    
    console.log('Date filter object:', dateFilter);

    // Role-based filtering
    const doctorQuery: any = { status: 'active' };

    if (authResult.user?.role === 'kam') {
      // KAM can only see their own district+team combination's data
      const kamUser = await User.findById(authResult.user.userId);
      if (kamUser && kamUser.district_id && kamUser.team_id) {
        doctorQuery.district_id = kamUser.district_id;
        doctorQuery.team_id = kamUser.team_id;
      } else {
        // If KAM has no district or team, show no data
        doctorQuery.district_id = null;
        doctorQuery.team_id = null;
      }
    } else if (teamId) {
      // Super Admin filtering by specific team
      doctorQuery.team_id = teamId;
    } else if (districtId) {
      // Super Admin filtering by district
      doctorQuery.district_id = districtId;
    }

    // Get doctors based on filters
    const doctors = await Doctor.find(doctorQuery).select('_id name team_id district_id');
    const doctorIds = doctors.map(d => d._id);

    if (doctorIds.length === 0) {
      return successResponse({
        summary: {
          totalRevenue: 0,
          totalPrescriptions: 0,
          totalOrders: 0,
          activePatients: 0,
          averageOrderValue: 0,
          fulfillmentRate: 0
        },
        doctors: []
      });
    }

    // Build prescription query
    const prescriptionQuery: any = {
      doctor_id: { $in: doctorIds }
    };
    if (Object.keys(dateFilter).length > 0) {
      // Use createdAt as that's what's actually in the DB
      prescriptionQuery.createdAt = dateFilter;
    }

    console.log('Prescription query:', prescriptionQuery);

    // Get prescriptions
    const prescriptions = await Prescription.find(prescriptionQuery)
      .populate('doctor_id', 'name specialty')
      .populate('patient_id', 'name mrn');
    
    console.log('Found prescriptions:', prescriptions.length);

    const prescriptionIds = prescriptions.map(p => p._id);

    // Build order query
    const orderQuery: any = {
      prescription_id: { $in: prescriptionIds }
    };

    // Get orders
    const orders = await Order.find(orderQuery);

    // Calculate summary metrics
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const totalOrders = orders.length;
    const fulfilledOrders = orders.filter(o => o.order_status === 'fulfilled').length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const fulfillmentRate = totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;

    // Get unique patients
    const uniquePatientIds = [...new Set(prescriptions.map(p => p.patient_id._id.toString()))];

    // Calculate doctor-wise performance
    const doctorPerformance = doctors.map(doctor => {
      const doctorPrescriptions = prescriptions.filter(
        p => p.doctor_id._id.toString() === doctor._id.toString()
      );
      
      const doctorPrescriptionIds = doctorPrescriptions.map(p => p._id);
      const doctorOrders = orders.filter(o =>
        doctorPrescriptionIds.some(pid => pid.toString() === o.prescription_id.toString())
      );
      
      const doctorRevenue = doctorOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

      return {
        doctor: {
          _id: doctor._id,
          name: doctor.name
        },
        prescriptions: doctorPrescriptions.length,
        orders: doctorOrders.length,
        revenue: doctorRevenue,
        patients: [...new Set(doctorPrescriptions.map(p => p.patient_id._id.toString()))].length
      };
    });

    // Sort by revenue descending
    doctorPerformance.sort((a, b) => b.revenue - a.revenue);

    // Get team or district information if applicable
    let contextInfo = null;
    if (teamId) {
      // Get team info when filtering by team
      const team = await Team.findById(teamId);
      if (team) {
        contextInfo = {
          type: 'team',
          _id: team._id,
          name: team.name
        };
      }
    } else if (districtId || authResult.user?.role === 'kam') {
      // Get district info when filtering by district or for KAM
      let districtIdToFind: string | undefined = districtId;
      if (authResult.user?.role === 'kam') {
        const kamUser = await User.findById(authResult.user.userId);
        districtIdToFind = kamUser?.district_id?.toString();
      }

      if (districtIdToFind) {
        const District = (await import('@/lib/models/District')).default;
        const district = await District.findById(districtIdToFind);

        if (district) {
          // Find KAM for this district
          const districtKam = await User.findOne({ district_id: district._id, role: 'kam', status: 'active' });

          contextInfo = {
            type: 'district',
            _id: district._id,
            name: district.name,
            code: district.code,
            kam: districtKam ? { name: districtKam.name, email: districtKam.email } : null
          };
        }
      }
    }

    return successResponse({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPrescriptions: prescriptions.length,
        totalOrders,
        activePatients: uniquePatientIds.length,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        fulfillmentRate: Math.round(fulfillmentRate * 100) / 100
      },
      context: contextInfo,
      doctors: doctorPerformance,
      dateRange: {
        from: dateFrom || null,
        to: dateTo || null
      }
    });
  } catch (error: any) {
    console.error('Error generating sales report:', error);
    return errorResponse(error.message || 'Failed to generate sales report');
  }
}

