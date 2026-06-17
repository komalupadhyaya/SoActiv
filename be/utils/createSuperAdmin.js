/**
 * Script to create the Super Admin user
 * 
 * Run this ONCE to create the Super Admin account.
 * 
 * Usage: node utils/createSuperAdmin.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const dns = require("dns");
const jwt = require("jsonwebtoken");

// Force Node to use reliable public DNS servers for Atlas SRV resolution
try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
    console.warn("Could not set custom DNS servers:", e.message);
}

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/soActive";

const SUPER_ADMIN_DATA = {
    email: process.env.SUPER_ADMIN_EMAIL,
    password: process.env.SUPER_ADMIN_PASSWORD,
    fullname: "Super Admin",
    role: "superadmin",
    isActive: true
};

if (!SUPER_ADMIN_DATA.email || !SUPER_ADMIN_DATA.password) {
    console.error("❌ Error: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD environment variables must be set!");
    process.exit(1);
}

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
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to database\n");

        // Check if super admin already exists
        const existingSuperAdmin = await User.findOne({ email: SUPER_ADMIN_DATA.email });
        if (existingSuperAdmin) {
            console.log("⚠️  Super Admin with this email already exists:");
            console.log(`   Email: ${existingSuperAdmin.email}`);
            console.log(`   Name: ${existingSuperAdmin.fullname}\n`);
            
            const token = jwt.sign(
                {
                    _id: existingSuperAdmin._id,
                    email: existingSuperAdmin.email,
                    role: existingSuperAdmin.role,
                    gym: existingSuperAdmin.gym,
                    sessionId: null,
                    tokenVersion: existingSuperAdmin.tokenVersion || 0
                },
                process.env.ACCESS_TOKEN_SECRET || "your-super-secret-jwt-key",
                { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "7d" }
            );
            console.log("\n🔑 Access Token:");
            console.log(token);
            console.log();

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
        
        const token = jwt.sign(
            {
                _id: superAdmin._id,
                email: superAdmin.email,
                role: superAdmin.role,
                gym: superAdmin.gym,
                sessionId: null,
                tokenVersion: superAdmin.tokenVersion || 0
            },
            process.env.ACCESS_TOKEN_SECRET || "your-super-secret-jwt-key",
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "7d" }
        );
        console.log("\n🔑 Access Token:");
        console.log(token);

        console.log("\n🔐 Login URL:");
        console.log("   http://localhost:5173/super-admin/login");
        console.log("\n⚠️  IMPORTANT: Keep these credentials secure!\n");

        await mongoose.disconnect();
        console.log("✅ Disconnected from database");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to create Super Admin:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run script
createSuperAdmin();
