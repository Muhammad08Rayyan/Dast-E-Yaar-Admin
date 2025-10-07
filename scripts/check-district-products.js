require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function checkDistrictProducts() {
  try {
    console.log('\n🔍 Checking District Products...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get models
    const DistrictProduct = mongoose.model('DistrictProduct', new mongoose.Schema({
      district_id: mongoose.Types.ObjectId,
      product_id: mongoose.Types.ObjectId,
      status: String,
      assigned_by: mongoose.Types.ObjectId,
    }));

    const District = mongoose.model('District', new mongoose.Schema({
      name: String,
      code: String,
    }));

    const Product = mongoose.model('Product', new mongoose.Schema({
      name: String,
      sku: String,
      price: Number,
    }));

    // Get all district products
    const districtProducts = await DistrictProduct.find({})
      .populate('district_id')
      .populate('product_id')
      .lean();

    console.log(`📊 Total District Products: ${districtProducts.length}\n`);

    if (districtProducts.length === 0) {
      console.log('⚠️  NO PRODUCTS ENABLED FOR ANY DISTRICT!');
      console.log('   This is why prescription creation is failing.\n');
      console.log('📋 To fix:');
      console.log('   1. Login to admin panel as KAM');
      console.log('   2. Go to Products page');
      console.log('   3. Enable some products (toggle switches)\n');
    } else {
      console.log('District Products Breakdown:\n');
      
      const byDistrict = {};
      districtProducts.forEach(dp => {
        const districtName = dp.district_id?.name || 'Unknown';
        if (!byDistrict[districtName]) {
          byDistrict[districtName] = { active: 0, inactive: 0 };
        }
        if (dp.status === 'active') {
          byDistrict[districtName].active++;
        } else {
          byDistrict[districtName].inactive++;
        }
      });

      Object.entries(byDistrict).forEach(([district, counts]) => {
        console.log(`   ${district}:`);
        console.log(`     ✓ Active: ${counts.active}`);
        console.log(`     ✗ Inactive: ${counts.inactive}\n`);
      });

      console.log('\n📝 Sample Active Products:');
      const activeProducts = districtProducts.filter(dp => dp.status === 'active').slice(0, 5);
      activeProducts.forEach(dp => {
        console.log(`   - ${dp.product_id?.name || 'N/A'} (${dp.product_id?.sku || 'N/A'})`);
        console.log(`     District: ${dp.district_id?.name || 'N/A'}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkDistrictProducts();


