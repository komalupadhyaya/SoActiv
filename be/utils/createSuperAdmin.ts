/**
 * Script to create the Super Admin user
 * 
 * Run this ONCE to create the Super Admin account.
 * 
 * Usage: bun run utils/createSuperAdmin.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/soActive";

// Super Admin credentials
const SUPER_ADMIN_DATA = {
    email: "tongkhotinchon@gmail.com",
    password: "lettonghk",
    fullname: "Patong",
    role: "superadmin",
    isActive: true
};

async function createSuperAdmin() {
    try {
        console.log("🔄 Connecting to database...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to database\n");

        // Check if super admin already exists (check for superadmin role specifically)
        const existingSuperAdmin = await User.findOne({
            email: SUPER_ADMIN_DATA.email,
            role: "superadmin"
        });

        if (existingSuperAdmin) {
            console.log("⚠️  Super Admin with this email already exists:");
            console.log(`   Email: ${existingSuperAdmin.email}`);
            console.log(`   Name: ${existingSuperAdmin.fullname}\n`);
            console.log("❌ Exiting safely - no changes made");
            await mongoose.disconnect();
            return;
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
    } catch (error) {
        console.error("❌ Failed to create Super Admin:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run script
createSuperAdmin();
