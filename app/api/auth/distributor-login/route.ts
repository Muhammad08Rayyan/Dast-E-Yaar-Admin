import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Distributor from '@/lib/models/Distributor';
import { signToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Email and password are required' } },
        { status: 400 }
      );
    }

    // Find distributor
    const distributor = await Distributor.findOne({ email: email.toLowerCase() });
    if (!distributor) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Check if distributor is active
    if (distributor.status !== 'active') {
      return NextResponse.json(
        { success: false, error: { message: 'Your account is inactive. Please contact support.' } },
        { status: 403 }
      );
    }

    // Verify password using the comparePassword method from the model
    const isPasswordValid = await distributor.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({
      userId: distributor._id.toString(),
      email: distributor.email,
      role: 'distributor',
      team_id: null,
      district_id: null,
      city_id: distributor.city_id ? distributor.city_id.toString() : null,
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: distributor._id,
          email: distributor.email,
          name: distributor.name,
          role: 'distributor',
          city_id: distributor.city_id,
        },
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Distributor login error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'An error occurred during login' } },
      { status: 500 }
    );
  }
}
