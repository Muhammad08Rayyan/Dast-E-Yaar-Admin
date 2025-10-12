import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import connectDB from '@/lib/mongodb';
import Banner from '@/lib/models/Banner';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { uploadToCloudinary } from '@/lib/utils/cloudinary';

// GET /api/banners - Get all banners (with optional active filter)
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin', 'kam']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const query = activeOnly ? { is_active: true } : {};
    const banners = await Banner.find(query).sort({ order: 1, createdAt: -1 }).lean();

    return successResponse({
      banners,
      total: banners.length,
    });
  } catch (error: any) {
    console.error('Error fetching banners:', error);
    return errorResponse(error.message || 'Failed to fetch banners', 500);
  }
}

// POST /api/banners - Create new banner
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request, ['super_admin']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const order = parseInt(formData.get('order') as string) || 0;
    const is_active = formData.get('is_active') === 'true';
    const imageFile = formData.get('image') as File;

    if (!title) {
      return errorResponse('Title is required', 400);
    }

    if (!imageFile) {
      return errorResponse('Image is required', 400);
    }

    // Validate image file
    if (!imageFile.type.startsWith('image/')) {
      return errorResponse('Only image files are allowed', 400);
    }

    // Convert File to Buffer
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer);

    // Create banner in database
    const banner = await Banner.create({
      title,
      description,
      order,
      is_active,
      image_url: uploadResult.secure_url,
      cloudinary_id: uploadResult.public_id,
    });

    return successResponse(
      {
        banner,
      },
      'Banner created successfully',
      201
    );
  } catch (error: any) {
    console.error('Error creating banner:', error);
    return errorResponse(error.message || 'Failed to create banner', 500);
  }
}
