import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import City from '@/lib/models/City';
import Distributor from '@/lib/models/Distributor';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || '';
    const distributor_channel = searchParams.get('distributor_channel') || '';

    // Build query
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    if (distributor_channel) {
      query.distributor_channel = distributor_channel;
    }

    const cities = await City.find(query)
      .populate('distributor_id', 'name email phone')
      .limit(limit)
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: {
        cities
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch cities' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { name, distributor_channel, distributor_name, distributor_email, distributor_phone, distributor_password } = body;

    // Validate required fields
    if (!name || !distributor_channel) {
      return NextResponse.json(
        { success: false, error: { message: 'City name and distributor channel are required' } },
        { status: 400 }
      );
    }

    // Check if city already exists
    const existingCity = await City.findOne({ name: name.trim() });
    if (existingCity) {
      return NextResponse.json(
        { success: false, error: { message: 'City with this name already exists' } },
        { status: 400 }
      );
    }

    let distributorId = null;

    // If distributor channel is 'other', create distributor
    if (distributor_channel === 'other') {
      if (!distributor_name || !distributor_email || !distributor_phone || !distributor_password) {
        return NextResponse.json(
          { success: false, error: { message: 'Distributor details are required for "Other" channel' } },
          { status: 400 }
        );
      }

      // Check if distributor email already exists
      const existingDistributor = await Distributor.findOne({ email: distributor_email.toLowerCase() });
      if (existingDistributor) {
        return NextResponse.json(
          { success: false, error: { message: 'Distributor with this email already exists' } },
          { status: 400 }
        );
      }

      // Create new distributor
      const newDistributor = new Distributor({
        name: distributor_name.trim(),
        email: distributor_email.toLowerCase().trim(),
        phone: distributor_phone.trim(),
        password: distributor_password,
        role: 'distributor',
        status: 'active',
      });

      await newDistributor.save();
      distributorId = newDistributor._id;
    }

    // Create city
    const newCity = new City({
      name: name.trim(),
      distributor_channel,
      distributor_id: distributorId,
      status: 'active',
    });

    await newCity.save();

    // If distributor was created, update their city_id
    if (distributorId) {
      await Distributor.findByIdAndUpdate(distributorId, { city_id: newCity._id });
    }

    // Populate distributor info before returning
    await newCity.populate('distributor_id', 'name email phone');
    return NextResponse.json({
      success: true,
      data: newCity,
      message: 'City created successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to create city', details: String(error) } },
      { status: 500 }
    );
  }
}
