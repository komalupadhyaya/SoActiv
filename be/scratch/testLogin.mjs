import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import axios from "axios";
import dns from "dns";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 8000;
const email = "komalsoftiatric@gmail.com";
const password = "komal123";

async function runTest() {
    console.log("=== Phase 1: Checking local running server ===");
    try {
        const url = `http://localhost:${PORT}/api/v1/super-admin/auth/login`;
        console.log(`Sending POST request to ${url}...`);
        const res = await axios.post(url, { email, password });
        console.log("✅ Success! Response data:", JSON.stringify(res.data, null, 2));
        console.log("Response headers:", res.headers);
        console.log("Set-Cookie header:", res.headers['set-cookie']);
        return;
    } catch (err) {
        console.log("ℹ️ Local server is not running or returned error. Error message:", err.message);
        if (err.response) {
            console.log("Error response data:", err.response.data);
            return;
        }
    }

    console.log("\n=== Phase 2: Testing auth logic programmatically via DB ===");
    try {
        console.log("Connecting to database...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected.");
        
        console.log("List of all databases on this connection:");
        const adminDb = mongoose.connection.client.db("admin");
        const dbsList = await adminDb.admin().listDatabases();
        dbsList.databases.forEach(d => console.log(` - ${d.name}`));

        console.log("DB Name:", mongoose.connection.name);
        
        console.log("List of collections in database and document counts:");
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            if (count > 0) {
                console.log(` - ${col.name}: ${count} docs`);
            }
        }

        console.log(`Finding user raw with email: ${email}...`);
        const userDoc = await mongoose.connection.db.collection("users").findOne({ email });
        console.log("Raw user doc:", userDoc);

        console.log(`Finding user with email: ${email}...`);
        const user = await User.findOne({ email });
        if (!user) {
            console.error("❌ User not found in database!");
            await mongoose.disconnect();
            return;
        }
        console.log(`✅ User found. Full Name: "${user.fullname}", Role: "${user.role}"`);

        console.log("Verifying password...");
        const isMatch = await user.isPasswordCorrect(password);
        if (isMatch) {
            console.log("✅ Password is correct!");
        } else {
            console.error("❌ Password verification failed!");
        }

        console.log("Generating access token...");
        const token = user.generateAccessToken();
        console.log("✅ Token successfully generated:");
        console.log(token);

        await mongoose.disconnect();
        console.log("Disconnected from database.");
    } catch (dbErr) {
        console.error("❌ DB/Auth verification failed:", dbErr);
    }
}

runTest();
