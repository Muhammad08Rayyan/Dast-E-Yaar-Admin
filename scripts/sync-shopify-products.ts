import mongoose from 'mongoose';
import Product from '../lib/models/Product';

// Shopify configuration
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI;

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
    throw new Error('Shopify credentials not configured. Please set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN in .env.local');
  }

  console.log(`\n🔄 Fetching products from Shopify store: ${SHOPIFY_STORE_URL}...`);

  const products: ShopifyProduct[] = [];
  let hasNextPage = true;
  let cursor = null;
  let pageCount = 0;

  while (hasNextPage) {
    pageCount++;
    console.log(`   📄 Fetching page ${pageCount}...`);

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

    try {
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
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();

      if (data.errors) {
        throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors)}`);
      }

      const edges: any[] = data.data.products.edges;
      console.log(`   ✓ Found ${edges.length} products on this page`);

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
    } catch (error: any) {
      console.error(`\n❌ Error fetching from Shopify:`, error.message);
      throw error;
    }
  }

  console.log(`\n✓ Total products fetched from Shopify: ${products.length}`);
  return products;
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not configured. Please set it in .env.local');
  }

  console.log('\n🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✓ Connected to MongoDB');
}

async function syncProducts() {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Shopify Product Sync - Manual Run   ║');
    console.log('╚════════════════════════════════════════╝');

    // Connect to database
    await connectDB();

    // Fetch products from Shopify
    const shopifyProducts = await fetchShopifyProducts();

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    console.log('\n📦 Processing products...\n');

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
            console.log(`   ✓ Updated: ${productName} (SKU: ${sku})`);
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
            console.log(`   ✓ Added: ${productName} (SKU: ${sku})`);
          }
        } catch (err: any) {
          const errorMsg = `Error processing ${shopifyProduct.title}: ${err.message}`;
          errors.push(errorMsg);
          skippedCount++;
          console.log(`   ✗ ${errorMsg}`);
        }
      }
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║            Sync Complete!              ║');
    console.log('╚════════════════════════════════════════╝\n');
    console.log(`📊 Results:`);
    console.log(`   ✓ Products Added:   ${addedCount}`);
    console.log(`   ✓ Products Updated: ${updatedCount}`);
    console.log(`   ✗ Skipped/Errors:   ${skippedCount}`);
    console.log(`   📦 Total Processed: ${addedCount + updatedCount}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      errors.forEach(err => console.log(`   - ${err}`));
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the sync
syncProducts();

