import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: 'c:/Users/User/SoActiv/be/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soActive';
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-super-secret-jwt-key';

// Super Admin tongkhotinchon@gmail.com
const superAdminToken = jwt.sign(
    {
        _id: '6a0c59610b8f98f7743d5b91',
        role: 'superadmin'
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
);

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    if (!mongoose.connection.db) {
        throw new Error("DB connection not initialized");
    }

    // Get Admin user justin@gmail.com (id: 6a0d3e21b0c9502347ff55af)
    const adminUser = await mongoose.connection.db.collection('users').findOne({
        email: 'justin@gmail.com'
    });

    if (!adminUser) {
        throw new Error("Admin user not found");
    }

    const initialTokenVersion = adminUser.tokenVersion || 0;
    console.log(`Initial tokenVersion for Justin: ${initialTokenVersion}`);

    // Generate JWT for Justin with the correct tokenVersion
    const adminToken = jwt.sign(
        {
            _id: adminUser._id.toString(),
            role: adminUser.role,
            gym: adminUser.gym ? adminUser.gym.toString() : undefined,
            tokenVersion: initialTokenVersion
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
    );

    // 1. Make request BEFORE force logout
    console.log("\n--- Step 1: Request with valid token BEFORE force logout ---");
    const testBeforeRes = await fetch('http://localhost:8000/api/v1/user/getCurrentUser', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log("Status code:", testBeforeRes.status);
    const testBeforeData = (await testBeforeRes.json()) as any;
    console.log("Response success:", testBeforeData.success);

    // 2. Perform Force Logout as Super Admin
    console.log("\n--- Step 2: Super Admin triggers Force Logout for Justin ---");
    const forceLogoutRes = await fetch(`http://localhost:8000/api/v1/super-admin/admins/${adminUser._id}/force-logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    console.log("Force logout response status:", forceLogoutRes.status);
    const forceLogoutData = (await forceLogoutRes.json()) as any;
    console.log("Force logout message:", forceLogoutData.message);

    // 3. Make request AFTER force logout using the same token
    console.log("\n--- Step 3: Request with same token AFTER force logout ---");
    const testAfterRes = await fetch('http://localhost:8000/api/v1/user/getCurrentUser', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log("Status code:", testAfterRes.status);
    const testAfterData = (await testAfterRes.json()) as any;
    console.log("Response success:", testAfterData.success);
    console.log("Response message:", testAfterData.message);

    // Verify tokenVersion in DB after test
    const adminUserUpdated = await mongoose.connection.db.collection('users').findOne({
        email: 'justin@gmail.com'
    });
    console.log(`\nUpdated tokenVersion in DB for Justin: ${adminUserUpdated?.tokenVersion}`);

    await mongoose.disconnect();
}

run().catch(console.error);
