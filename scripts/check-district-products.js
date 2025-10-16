require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function checkDistrictProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
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
    if (districtProducts.length === 0) {
    } else {
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
      });
      const activeProducts = districtProducts.filter(dp => dp.status === 'active').slice(0, 5);
      activeProducts.forEach(dp => {
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkDistrictProducts();

