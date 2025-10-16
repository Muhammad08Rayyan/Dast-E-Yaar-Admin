/**
 * Seed script to create Super Admin user
 * Run with: npx ts-node scripts/seed-admin.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;

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

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    const superAdminEmail = 'admin@dasteyaar.com';
    const superAdminPassword = 'AtCCL@789';

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email: superAdminEmail });

    if (existingAdmin) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
      
      // Update the user
      await User.updateOne(
        { email: superAdminEmail },
        { 
          password: hashedPassword,
          name: 'Super Administrator',
          role: 'super_admin',
          assigned_districts: [],
          status: 'active'
        }
      );
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
      
      // Create new super admin
      await User.create({
        email: superAdminEmail,
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

seedSuperAdmin();

