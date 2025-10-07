import { NextRequest } from 'next/server';
import { authMiddleware } from '@/lib/auth/middleware';
import { connectDB } from '@/lib/db/connection';
import Product from '@/lib/models/Product';
import { successResponse, errorResponse } from '@/lib/utils/response';

// Shopify Admin API configuration
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

interface ShopifyProduct {
  id: string;
  title: string;
  variants: Array<{
    id: string;
    title: string;
    sku: string;
    price: string;
  }>;
  status: string;
}

async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify credentials not configured');
  }

  const products: ShopifyProduct[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const query = `
      query getProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          edges {
            node {
              id
              title
              status
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    sku
                    price
                  }
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    const response: Response = await fetch(`https://${SHOPIFY_STORE_URL}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query,
        variables: { cursor },
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data: any = await response.json();

    if (data.errors) {
      throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors)}`);
    }

    const edges: any[] = data.data.products.edges;
    
    for (const edge of edges) {
      const product: any = edge.node;
      products.push({
        id: product.id.replace('gid://shopify/Product/', ''),
        title: product.title,
        status: product.status,
        variants: product.variants.edges.map((v: any) => ({
          id: v.node.id.replace('gid://shopify/ProductVariant/', ''),
          title: v.node.title,
          sku: v.node.sku || '',
          price: v.node.price,
        })),
      });
      cursor = edge.cursor;
    }

    hasNextPage = data.data.products.pageInfo.hasNextPage;
  }

  return products;
}

// POST /api/products/sync - Sync products from Shopify (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    console.log('=== Product Sync Request ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    const authResult = await authMiddleware(request, ['super_admin']);
    console.log('Auth result:', authResult);
    
    if (!authResult.authorized) {
      console.log('Auth failed:', authResult.message);
      return errorResponse(authResult.message, 401);
    }

    console.log('User authorized:', authResult.user);
    await connectDB();

    // Fetch products from Shopify
    const shopifyProducts = await fetchShopifyProducts();

    let addedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // Process each product
    for (const shopifyProduct of shopifyProducts) {
      // Process each variant as a separate product
      for (const variant of shopifyProduct.variants) {
        try {
          const sku = variant.sku || `SHOPIFY-${variant.id}`;
          const productName = shopifyProduct.variants.length > 1 
            ? `${shopifyProduct.title} - ${variant.title}`
            : shopifyProduct.title;

          // Check if product already exists
          const existingProduct = await Product.findOne({
            $or: [
              { shopify_product_id: variant.id },
              { sku: sku }
            ]
          });

          if (existingProduct) {
            // Update existing product
            existingProduct.name = productName;
            existingProduct.price = parseFloat(variant.price);
            existingProduct.shopify_product_id = variant.id;
            existingProduct.status = shopifyProduct.status === 'ACTIVE' ? 'active' : 'inactive';
            await existingProduct.save();
            updatedCount++;
          } else {
            // Create new product
            await Product.create({
              name: productName,
              sku: sku,
              description: `${shopifyProduct.title} - Synced from Shopify`,
              price: parseFloat(variant.price),
              shopify_product_id: variant.id,
              status: shopifyProduct.status === 'ACTIVE' ? 'active' : 'inactive',
            });
            addedCount++;
          }
        } catch (err: any) {
          errors.push(`Error processing ${shopifyProduct.title}: ${err.message}`);
        }
      }
    }

    return successResponse(
      {
        totalProcessed: shopifyProducts.length,
        addedCount,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
      `Successfully synced ${addedCount + updatedCount} products from Shopify`
    );
  } catch (error: any) {
    console.error('Error syncing products:', error);
    return errorResponse(error.message || 'Failed to sync products from Shopify', 500);
  }
}

