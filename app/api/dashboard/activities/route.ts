import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import { Prescription, Patient, Doctor } from '@/lib/models';
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

    // Only super admin can view dashboard activities
    if (authResult.user.role !== 'super_admin') {
      return NextResponse.json(
        apiResponse(false, 'Access denied', null, { code: 'FORBIDDEN' }),
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Get recent prescriptions with populated data, sorted by order number descending
    const recentPrescriptions = await Prescription.find()
      .sort({ shopify_order_number: -1 })
      .limit(10)
      .populate('patient_id', 'name mrn')
      .populate('doctor_id', 'name specialization')
      .select('mrn order_status created_at prescription_text selected_product patient_id doctor_id shopify_order_number')
      .lean();

    // Format the activities
    const activities = recentPrescriptions.map((prescription: any) => ({
      id: prescription._id,
      type: 'prescription',
      prescriptionNumber: prescription.mrn || 'N/A',
      patient: {
        name: prescription.patient_id?.name || 'Unknown Patient',
        mrn: prescription.mrn || 'N/A',
      },
      doctor: {
        name: prescription.doctor_id?.name || 'Unknown Doctor',
        specialization: prescription.doctor_id?.specialization || 'General',
      },
      status: prescription.order_status,
      medicationCount: prescription.selected_product ? 1 : 0,
      createdAt: prescription.created_at,
    }));

    return NextResponse.json(
      apiResponse(true, 'Recent activities retrieved successfully', activities),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Dashboard activities error:', error);
    return NextResponse.json(
      apiResponse(false, 'Failed to fetch dashboard activities', null, {
        code: 'INTERNAL_ERROR',
        message: error.message,
      }),
      { status: 500 }
    );
  }
}

