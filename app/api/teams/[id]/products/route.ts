import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import { TeamProduct, Product } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// GET /api/teams/[id]/products - Get products assigned to a team
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

    // Fetch all products
    const allProducts = await Product.find({ status: 'active' })
      .select('_id name sku price description shopify_product_id shopify_variant_id')
      .lean();

    // Fetch assigned products for this team
    const assignedProducts = await TeamProduct.find({
      team_id: new mongoose.Types.ObjectId(id),
      status: 'active',
    })
      .select('product_id')
      .lean();

    const assignedProductIds = assignedProducts.map((ap) =>
      ap.product_id.toString()
    );

    // Mark which products are assigned
    const productsWithAssignment = allProducts.map((product) => ({
      ...product,
      _id: product._id.toString(),
      isAssigned: assignedProductIds.includes(product._id.toString()),
    }));

    return successResponse({
      products: productsWithAssignment,
      totalProducts: allProducts.length,
      assignedCount: assignedProductIds.length,
    });
  } catch (error: any) {
    console.error('Error fetching team products:', error);
    return errorResponse(error.message || 'Failed to fetch team products', 500);
  }
}

// POST /api/teams/[id]/products - Assign/unassign products to a team
export async function POST(
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
    const body = await request.json();
    const { productIds } = body; // Array of product IDs to assign

    if (!Array.isArray(productIds)) {
      return errorResponse('productIds must be an array', 400);
    }

    // Delete all existing assignments for this team
    await TeamProduct.deleteMany({
      team_id: new mongoose.Types.ObjectId(id),
    });

    // Create new assignments
    if (productIds.length > 0) {
      const assignments = productIds.map((productId) => ({
        team_id: new mongoose.Types.ObjectId(id),
        product_id: new mongoose.Types.ObjectId(productId),
        status: 'active',
      }));

      await TeamProduct.insertMany(assignments);
    }

    return successResponse(
      {
        message: 'Products assigned successfully',
        assignedCount: productIds.length,
      },
      'Products updated successfully'
    );
  } catch (error: any) {
    console.error('Error assigning products to team:', error);
    return errorResponse(
      error.message || 'Failed to assign products to team',
      500
    );
  }
}
