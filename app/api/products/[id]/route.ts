import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Product from '@/lib/models/Product';
import { successResponse, errorResponse } from '@/lib/utils/response';
import mongoose from 'mongoose';

// GET /api/products/:id - Get product details
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
      return errorResponse('Invalid product ID', 400);
    }

    const product = await Product.findById(id);

    if (!product) {
      return errorResponse('Product not found', 404);
    }

    return successResponse({ product });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return errorResponse(error.message || 'Failed to fetch product');
  }
}

// PUT /api/products/:id - Update product (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    // Only Super Admin can update products
    if (authResult.user?.role !== 'super_admin') {
      return errorResponse('Only Super Admin can update products', 403);
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid product ID', 400);
    }

    const body = await request.json();
    const { name, sku, price, description, shopify_product_id, shopify_variant_id, status } = body;

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Check if SKU is being changed and if it's already taken
    if (sku && sku.toUpperCase() !== product.sku) {
      const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
      if (existingProduct) {
        return errorResponse('SKU already exists', 400);
      }
      product.sku = sku.toUpperCase();
    }

    // Update fields
    if (name) product.name = name;
    if (price !== undefined) product.price = parseFloat(price);
    if (description !== undefined) product.description = description;
    if (shopify_product_id !== undefined) product.shopify_product_id = shopify_product_id || undefined;
    if (shopify_variant_id !== undefined) product.shopify_variant_id = shopify_variant_id || undefined;
    if (status && ['active', 'inactive'].includes(status)) {
      product.status = status;
    }

    await product.save();

    return successResponse(
      { product },
      'Product updated successfully'
    );
  } catch (error: any) {
    console.error('Error updating product:', error);
    return errorResponse(error.message || 'Failed to update product');
  }
}

// DELETE /api/products/:id - Delete product (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    // Only Super Admin can delete products
    if (authResult.user?.role !== 'super_admin') {
      return errorResponse('Only Super Admin can delete products', 403);
    }

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid product ID', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse('Product not found', 404);
    }

    // Delete the product
    await Product.findByIdAndDelete(id);

    return successResponse(null, 'Product deleted successfully');
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return errorResponse(error.message || 'Failed to delete product');
  }
}

