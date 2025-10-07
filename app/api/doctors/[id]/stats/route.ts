import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Doctor from '@/lib/models/Doctor';
import Prescription from '@/lib/models/Prescription';
import Order from '@/lib/models/Order';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// GET /api/doctors/:id/stats - Get doctor statistics
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid doctor ID', 400);
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return errorResponse('Doctor not found', 404);
    }

    // KAM scoping
    if (authResult.user?.role === 'kam') {
      if (!authResult.user.assigned_district || 
          authResult.user.assigned_district.toString() !== doctor.district_id.toString()) {
        return errorResponse('You do not have access to this doctor', 403);
      }
    }

    // Get statistics
    const totalPrescriptions = await Prescription.countDocuments({ doctor_id: id });
    const totalOrders = await Order.countDocuments({ 'doctor_info.doctor_id': id });

    // Recent prescriptions
    const recentPrescriptions = await Prescription.find({ doctor_id: id })
      .populate('patient_id', 'name mrn')
      .sort({ created_at: -1 })
      .limit(10);

    // Prescription status breakdown
    const prescriptionsByStatus = await Prescription.aggregate([
      { $match: { doctor_id: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$order_status', count: { $sum: 1 } } }
    ]);

    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      { $match: { 'doctor_info.doctor_id': new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$order_status', count: { $sum: 1 } } }
    ]);

    return successResponse({
      stats: {
        total_prescriptions: totalPrescriptions,
        total_orders: totalOrders,
        prescriptions_by_status: prescriptionsByStatus,
        orders_by_status: ordersByStatus
      },
      recent_prescriptions: recentPrescriptions
    });
  } catch (error: any) {
    console.error('Error fetching doctor stats:', error);
    return errorResponse(error.message || 'Failed to fetch doctor statistics');
  }
}

