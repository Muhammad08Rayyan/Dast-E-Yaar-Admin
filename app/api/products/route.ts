import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import { Product, TeamProduct, User } from '@/lib/models';
import { successResponse, errorResponse } from '@/lib/utils/response';

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    let products: any[] = [];
    let total = 0;

    // Role-based filtering
    if (authResult.user?.role === 'kam') {
      // KAM can only see products assigned to their team
      const kamUser = await User.findById(authResult.user.userId);
      if (kamUser && kamUser.team_id) {
        // Get team products for this KAM's team
        const teamProducts = await TeamProduct.find({ 
          team_id: kamUser.team_id, 
          status: 'active' 
        }).populate('product_id');
        
        const productIds = teamProducts.map(tp => tp.product_id._id);
        
        // Filter products by team assignment
        if (productIds.length > 0) {
          const teamQuery = { ...query, _id: { $in: productIds } };
          [products, total] = await Promise.all([
            Product.find(teamQuery)
              .sort({ name: 1 })
              .limit(limit)
              .skip(skip)
              .lean(),
            Product.countDocuments(teamQuery),
          ]);
        }
      }
    } else {
      // Super Admin sees all products
      [products, total] = await Promise.all([
        Product.find(query)
          .sort({ name: 1 })
          .limit(limit)
          .skip(skip)
          .lean(),
        Product.countDocuments(query),
      ]);
    }

    return successResponse({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return errorResponse(error.message || 'Failed to fetch products');
  }
}

// POST /api/products - Create new product (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.authorized) {
      return errorResponse(authResult.message, 401);
    }

    // Only Super Admin can create products
    if (authResult.user?.role !== 'super_admin') {
      return errorResponse('Only Super Admin can create products', 403);
    }

    await connectDB();

    const body = await request.json();
    const { name, sku, price, description, shopify_product_id, shopify_variant_id, status } = body;

    // Validate required fields
    if (!name || !sku || !price) {
      return errorResponse('Name, SKU, and price are required', 400);
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return errorResponse('SKU already exists', 400);
    }

    // Create product
    const product = await Product.create({
      name,
      sku: sku.toUpperCase(),
      price: parseFloat(price),
      description: description || '',
      shopify_product_id: shopify_product_id || undefined,
      shopify_variant_id: shopify_variant_id || undefined,
      status: status || 'active',
    });

    return successResponse(
      { product },
      'Product created successfully',
      201
    );
  } catch (error: any) {
    console.error('Error creating product:', error);
    return errorResponse(error.message || 'Failed to create product');
  }
}

