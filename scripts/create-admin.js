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
    await mongoose.connect(MONGODB_URI);
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // New Super Admin credentials
    const newAdminEmail = 'superadmin@dasteyaar.com';
    const newAdminPassword = 'Super@Admin123';

    // Check if this admin already exists
    const existingAdmin = await User.findOne({ email: newAdminEmail });

    if (existingAdmin) {
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
    } else {
      const hashedPassword = await bcrypt.hash(newAdminPassword, 10);
      
      await User.create({
        email: newAdminEmail,
        password: hashedPassword,
        name: 'Super Administrator',
        role: 'super_admin',
        assigned_districts: [],
        status: 'active'
      });
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

createSuperAdmin();

