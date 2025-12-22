/**
 * Migration Script: Add SaaS fields to existing gyms
 * 
 * This script updates all existing gyms to have the new SaaS fields
 * with sensible defaults to maintain backward compatibility.
 * 
 * Run this ONCE after deploying the new Gym model.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Gym } from "../models/gym.model.js";
import { Subscription } from "../models/subscription.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/soActive";

async function migrateGyms() {
    try {
        console.log("🔄 Connecting to database...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to database");

        // Find all gyms without the new fields
        const gymsToMigrate = await Gym.find({
            $or: [
                { plan: { $exists: false } },
                { status: { $exists: false } },
                { features: { $exists: false } }
            ]
        });

        console.log(`📊 Found ${gymsToMigrate.length} gyms to migrate`);

        if (gymsToMigrate.length === 0) {
            console.log("✅ No gyms need migration. All gyms are up to date.");
            await mongoose.disconnect();
            return;
        }

        // Update each gym
        for (const gym of gymsToMigrate) {
            console.log(`🔄 Migrating gym: ${gym.name} (${gym._id})`);

            // Set default values
            gym.plan = gym.plan || "pro";
            gym.status = gym.status || "active";
            gym.features = gym.features || {
                payments: true,
                attendance: true,
                pt: true,
                classes: true,
                memberPortal: true
            };

            await gym.save();

            // Create subscription if doesn't exist
            const existingSubscription = await Subscription.findOne({ gymId: gym._id });
            if (!existingSubscription) {
                await Subscription.create({
                    gymId: gym._id,
                    plan: gym.plan,
                    status: "active",
                    billingCycle: "monthly",
                    amount: 0, // Will be set when payment integration is added
                    currency: "INR"
                });
                console.log(`  ✅ Created subscription for gym: ${gym.name}`);
            }

            console.log(`  ✅ Migrated gym: ${gym.name}`);
        }

        console.log(`\n✅ Migration complete! Migrated ${gymsToMigrate.length} gyms.`);
        console.log("\n📋 Summary:");
        console.log(`  - All gyms set to 'pro' plan`);
        console.log(`  - All gyms set to 'active' status`);
        console.log(`  - All features enabled by default`);
        console.log(`  - Subscriptions created for all gyms`);

        await mongoose.disconnect();
        console.log("\n✅ Disconnected from database");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run migration
migrateGyms();
