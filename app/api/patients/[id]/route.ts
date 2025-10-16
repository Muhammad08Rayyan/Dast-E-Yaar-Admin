import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Patient from '@/lib/models/Patient';
import Prescription from '@/lib/models/Prescription';
import Order from '@/lib/models/Order';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// GET /api/patients/:id - Get patient details (Super Admin only)
export async function GET(
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid patient ID', 400);
    }

    const patient = await Patient.findById(id)
      .populate({
        path: 'created_by',
        select: 'name email phone pmdc_number specialty',
        populate: {
          path: 'district_id',
          select: 'name code',
        },
      });

    if (!patient) {
      return errorResponse('Patient not found', 404);
    }

    // Get patient's prescriptions
    const prescriptions = await Prescription.find({ patient_id: id })
      .populate('doctor_id', 'name email specialty')
      .populate('district_id', 'name code')
      .sort({ created_at: -1 })
      .limit(10);

    // Get patient's orders
    const orders = await Order.find({ 'patient_info.mrn': patient.mrn })
      .populate('doctor_info.district_id', 'name code')
      .sort({ created_at: -1 })
      .limit(10);

    // Get stats
    const totalPrescriptions = await Prescription.countDocuments({ patient_id: id });
    const totalOrders = await Order.countDocuments({ 'patient_info.mrn': patient.mrn });

    return successResponse({
      patient,
      prescriptions,
      orders,
      stats: {
        totalPrescriptions,
        totalOrders,
      },
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch patient');
  }
}

