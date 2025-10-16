import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import connectDB from '@/lib/mongodb';
import Banner from '@/lib/models/Banner';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/utils/cloudinary';
import mongoose from 'mongoose';

// GET /api/banners/[id] - Get specific banner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authMiddleware(request, ['super_admin', 'kam']);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid banner ID', 400);
    }

    const banner = await Banner.findById(id).lean();

    if (!banner) {
      return errorResponse('Banner not found', 404);
    }

    return successResponse({ banner });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to fetch banner', 500);
  }
}

// PUT /api/banners/[id] - Update banner
export async function PUT(
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
      return errorResponse('Invalid banner ID', 400);
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const order = formData.get('order') ? parseInt(formData.get('order') as string) : undefined;
    const is_active = formData.get('is_active') === 'true';
    const imageFile = formData.get('image') as File | null;

    const banner = await Banner.findById(id);

    if (!banner) {
      return errorResponse('Banner not found', 404);
    }

    // Update basic fields
    if (title) banner.title = title;
    if (description !== undefined) banner.description = description;
    if (order !== undefined) banner.order = order;
    if (is_active !== undefined) banner.is_active = is_active;

    // If new image is provided, upload it and delete old one
    if (imageFile && imageFile.size > 0) {
      // Validate image file
      if (!imageFile.type.startsWith('image/')) {
        return errorResponse('Only image files are allowed', 400);
      }

      // Convert File to Buffer
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload new image to Cloudinary
      const uploadResult = await uploadToCloudinary(buffer);

      // Delete old image from Cloudinary
      if (banner.cloudinary_id) {
        try {
          await deleteFromCloudinary(banner.cloudinary_id);
        } catch (error) {
          // Continue even if deletion fails
        }
      }

      // Update image fields
      banner.image_url = uploadResult.secure_url;
      banner.cloudinary_id = uploadResult.public_id;
    }

    await banner.save();

    return successResponse(
      {
        banner,
      },
      'Banner updated successfully'
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to update banner', 500);
  }
}

// DELETE /api/banners/[id] - Delete banner
export async function DELETE(
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
      return errorResponse('Invalid banner ID', 400);
    }

    const banner = await Banner.findById(id);

    if (!banner) {
      return errorResponse('Banner not found', 404);
    }

    // Delete image from Cloudinary
    if (banner.cloudinary_id) {
      try {
        await deleteFromCloudinary(banner.cloudinary_id);
      } catch (error) {
        // Continue even if deletion fails
      }
    }

    // Delete banner from database
    await Banner.findByIdAndDelete(id);

    return successResponse(
      {
        message: 'Banner deleted successfully',
      },
      'Banner deleted successfully'
    );
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to delete banner', 500);
  }
}
