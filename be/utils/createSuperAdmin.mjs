/**
 * Script to create the Super Admin user - ES Module Version
 * 
 * Run this ONCE to create the Super Admin account.
 * 
 * Usage: node --loader ts-node/esm utils/createSuperAdmin.mjs
 * Or simply: npm run create-superadmin
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/soActive";

// Super Admin credentials
const SUPER_ADMIN_DATA = {
    email: "chiragsoftiatric@gmail.com",
    password: "lettonghk",
    fullname: "Chirag",
    role: "superadmin",
    isActive: true
};

// User Schema (simplified for this script)
const userSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "superadmin", "staff"], default: "admin" },
    avatar: { type: String },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: "Gym" },
    phone: { type: String }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function createSuperAdmin() {
    try {
        console.log("🔄 Connecting to database...");
        console.log("Using URI:", MONGODB_URI.replace(/:([^:@]+)@/, ":****@")); // Mask password
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to database\n");

        // Check if super admin already exists (check for superadmin role specifically)
        // Check if user with this email already exists
        const existingUser = await User.findOne({ email: SUPER_ADMIN_DATA.email });

        if (existingUser) {
            console.log(`⚠️  User with email ${SUPER_ADMIN_DATA.email} already exists.`);

            if (existingUser.role === 'superadmin') {
                console.log("✅ User is already a Super Admin. No changes needed.\n");
            } else {
                console.log(`🔄 Upgrading user from '${existingUser.role}' to 'superadmin'...`);
                existingUser.role = 'superadmin';
                await existingUser.save();
                console.log("✅ User role upgraded successfully!\n");
            }

            console.log("📋 Login Details:");
            console.log(`   Email: ${SUPER_ADMIN_DATA.email}`);
            console.log("   (Use your existing password if you didn't change it, or default if new)");

            await mongoose.disconnect();
            console.log("✅ Disconnected from database");
            process.exit(0);
        }

        // Hash password with 10 salt rounds
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_DATA.password, 10);

        // Create Super Admin
        const superAdmin = await User.create({
            fullname: SUPER_ADMIN_DATA.fullname,
            email: SUPER_ADMIN_DATA.email,
            password: hashedPassword,
            role: SUPER_ADMIN_DATA.role,
            avatar: "default-avatar.png"
        });

        console.log("✅ Super Admin Created Successfully\n");
        console.log("📋 Details:");
        console.log(`   Email: ${SUPER_ADMIN_DATA.email}`);
        console.log(`   Password: ${SUPER_ADMIN_DATA.password}`);
        console.log(`   Username: ${SUPER_ADMIN_DATA.fullname}`);
        console.log("\n🔐 Login URL:");
        console.log("   http://localhost:5173/super-admin/login");
        console.log("\n⚠️  IMPORTANT: Keep these credentials secure!\n");

        await mongoose.disconnect();
        console.log("✅ Disconnected from database");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to create Super Admin:");
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run script
createSuperAdmin();
