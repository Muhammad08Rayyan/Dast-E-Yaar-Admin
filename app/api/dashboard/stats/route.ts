import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import { User, Doctor, Prescription, Order, Patient, Product, District, Team } from '@/lib/models';
import { apiResponse } from '@/lib/utils/response';
import { verifyAuth } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        apiResponse(false, 'Unauthorized', null, { code: 'UNAUTHORIZED' }),
        { status: 401 }
      );
    }

    // Only super admin can view dashboard stats
    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        apiResponse(false, 'Access denied', null, { code: 'FORBIDDEN' }),
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Get all statistics in parallel
    const [
      totalUsers,
      totalDoctors,
      totalPrescriptions,
      totalOrders,
      totalPatients,
      totalProducts,
      totalDistricts,
      totalTeams,
      pendingOrders,
      processingOrders,
      fulfilledOrders,
      activeOrders,
      activeDoctors,
      inactiveDoctors,
      activeTeams,
      activeKAMs,
    ] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Prescription.countDocuments(),
      Order.countDocuments(),
      Patient.countDocuments(),
      Product.countDocuments(),
      District.countDocuments(),
      Team.countDocuments(),
      Order.countDocuments({ order_status: 'pending' }),
      Order.countDocuments({ order_status: 'processing' }),
      Order.countDocuments({ order_status: 'fulfilled' }),
      Order.countDocuments({ order_status: { $in: ['pending', 'processing'] } }),
      Doctor.countDocuments({ status: 'active' }),
      Doctor.countDocuments({ status: 'inactive' }),
      Team.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'kam', status: 'active' }),
    ]);

    // Calculate order statistics
    const orderStats = {
      total: totalOrders,
      pending: pendingOrders,
      processing: processingOrders,
      fulfilled: fulfilledOrders,
      active: activeOrders,
      fulfillmentRate: totalOrders > 0 ? ((fulfilledOrders / totalOrders) * 100).toFixed(1) : '0',
    };

    // Calculate doctor statistics
    const doctorStats = {
      total: totalDoctors,
      active: activeDoctors,
      inactive: inactiveDoctors,
      activeRate: totalDoctors > 0 ? ((activeDoctors / totalDoctors) * 100).toFixed(1) : '0',
    };

    const stats = {
      users: totalUsers,
      doctors: doctorStats,
      prescriptions: totalPrescriptions,
      orders: orderStats,
      patients: totalPatients,
      products: totalProducts,
      districts: totalDistricts,
      teams: totalTeams,
      activeTeams,
      activeKAMs,
    };

    return NextResponse.json(
      apiResponse(true, 'Dashboard statistics retrieved successfully', stats),
      { status: 200 }
    );
  } catch (error: any) {

    return NextResponse.json(
      apiResponse(false, 'Failed to fetch dashboard statistics', null, {
        code: 'INTERNAL_ERROR',
        message: error.message,
      }),
      { status: 500 }
    );
  }
}

