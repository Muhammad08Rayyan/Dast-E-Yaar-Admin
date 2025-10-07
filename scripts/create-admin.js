/**
 * Quick script to create Super Admin user
 * Run with: node admin/scripts/create-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'admin/.env.local' });

// Hardcoded for script execution
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://muhammadrayyandev08_db_user:eZX207NuzPIdon1M@main.gmtc27k.mongodb.net/dast_e_yaar';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['super_admin', 'kam'], required: true },
  assigned_districts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'District' }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

async function createSuperAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // New Super Admin credentials
    const newAdminEmail = 'superadmin@dasteyaar.com';
    const newAdminPassword = 'Super@Admin123';

    // Check if this admin already exists
    const existingAdmin = await User.findOne({ email: newAdminEmail });

    if (existingAdmin) {
      console.log('Admin already exists. Updating password...');
      const hashedPassword = await bcrypt.hash(newAdminPassword, 10);
      
      await User.updateOne(
        { email: newAdminEmail },
        { 
          password: hashedPassword,
          name: 'Super Administrator',
          role: 'super_admin',
          assigned_districts: [],
          status: 'active'
        }
      );
      console.log('✅ Super Admin updated!\n');
    } else {
      console.log('Creating new Super Admin...');
      const hashedPassword = await bcrypt.hash(newAdminPassword, 10);
      
      await User.create({
        email: newAdminEmail,
        password: hashedPassword,
        name: 'Super Administrator',
        role: 'super_admin',
        assigned_districts: [],
        status: 'active'
      });
      console.log('✅ Super Admin created!\n');
    }

    console.log('═══════════════════════════════════════');
    console.log('🎉 SUPER ADMIN CREDENTIALS:');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:    ', newAdminEmail);
    console.log('🔑 Password: ', newAdminPassword);
    console.log('═══════════════════════════════════════\n');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();

