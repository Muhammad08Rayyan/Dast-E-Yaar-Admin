import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import City from '@/lib/models/City';
import Distributor from '@/lib/models/Distributor';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid city ID' } },
        { status: 400 }
      );
    }

    const city = await City.findById(id).populate('distributor_id', 'name email phone');

    if (!city) {
      return NextResponse.json(
        { success: false, error: { message: 'City not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: city });
  } catch (error) {
    console.error('Get city error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch city' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid city ID' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: { message: 'City name is required' } },
        { status: 400 }
      );
    }

    // Check if another city with the same name exists
    const existingCity = await City.findOne({
      name: name.trim(),
      _id: { $ne: id }
    });

    if (existingCity) {
      return NextResponse.json(
        { success: false, error: { message: 'City with this name already exists' } },
        { status: 400 }
      );
    }

    const city = await City.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).populate('distributor_id', 'name email phone');

    if (!city) {
      return NextResponse.json(
        { success: false, error: { message: 'City not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: city,
      message: 'City updated successfully'
    });
  } catch (error) {
    console.error('Update city error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update city' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid city ID' } },
        { status: 400 }
      );
    }

    const city = await City.findById(id);

    if (!city) {
      return NextResponse.json(
        { success: false, error: { message: 'City not found' } },
        { status: 404 }
      );
    }

    // If city has a distributor, delete the distributor as well
    if (city.distributor_id) {
      await Distributor.findByIdAndDelete(city.distributor_id);
    }

    await City.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'City deleted successfully'
    });
  } catch (error) {
    console.error('Delete city error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete city' } },
      { status: 500 }
    );
  }
}
