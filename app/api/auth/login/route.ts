import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Distributor from '@/lib/models/Distributor';
import { signToken } from '@/lib/auth/jwt';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // First, try to find user in User collection
    let user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (user) {
      // Check if user is active
      if (user.status !== 'active') {
        return errorResponse('Your account has been deactivated', 403);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return errorResponse('Invalid email or password', 401);
      }

      // Generate JWT token
      const token = signToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        team_id: user.team_id ? user.team_id.toString() : null,
        district_id: user.district_id ? user.district_id.toString() : null,
      });

      // Return user data and token
      return successResponse(
        {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            team_id: user.team_id,
            district_id: user.district_id,
          },
          token,
        },
        'Login successful'
      );
    }

    // If not found in User collection, try Distributor collection
    const distributor = await Distributor.findOne({ email: email.toLowerCase() });

    if (!distributor) {
      return errorResponse('Invalid email or password', 401);
    }

    // Check if distributor is active
    if (distributor.status !== 'active') {
      return errorResponse('Your account has been deactivated', 403);
    }

    // Verify password using distributor's comparePassword method
    const isPasswordValid = await distributor.comparePassword(password);

    if (!isPasswordValid) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate JWT token for distributor
    const token = signToken({
      userId: distributor._id.toString(),
      email: distributor.email,
      role: 'distributor',
      team_id: null,
      district_id: null,
      city_id: distributor.city_id ? distributor.city_id.toString() : null,
    });

    // Return distributor data and token
    return successResponse(
      {
        user: {
          id: distributor._id,
          email: distributor.email,
          name: distributor.name,
          role: 'distributor',
          city_id: distributor.city_id,
        },
        token,
      },
      'Login successful'
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse('An error occurred during login', 500);
  }
}

