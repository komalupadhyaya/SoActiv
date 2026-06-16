import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Staff } from '../models/staff.model';

dotenv.config({ path: 'c:/Users/User/SoActiv/be/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soActive';
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-super-secret-jwt-key';

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error("DB connection not established");
    }

    // 1. Find a receptionist and a sales staff member
    const receptionist = await Staff.findOne({ position: 'receptionist', status: 'active' });
    const sales = await Staff.findOne({ position: 'sales', status: 'active' });

    if (!receptionist || !receptionist.userId) {
        console.error("No active receptionist with a userId found in DB to run test.");
        await mongoose.disconnect();
        return;
    }

    if (!sales || !sales.userId) {
        console.error("No active sales representative with a userId found in DB to run test.");
        await mongoose.disconnect();
        return;
    }

    console.log(`Found Receptionist: ${receptionist.fullName} (User ID: ${receptionist.userId})`);
    console.log(`Found Sales Staff: ${sales.fullName} (User ID: ${sales.userId})`);

    // 2. Generate auth token for receptionist
    const token = jwt.sign(
        {
            _id: receptionist.userId.toString(),
            role: 'staff',
            gym: receptionist.gym ? receptionist.gym.toString() : undefined
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: '1h' }
    );

    // 3. Submit walk-in lead enquiry
    console.log("\n--- Step 1: Submit walk-in lead enquiry as receptionist via HTTP ---");
    const testName = "HTTP Test Walk-in " + Date.now();
    const followUpDate = "2026-06-15";

    const submitRes = await fetch('http://localhost:8000/api/v1/enquiry', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: testName,
            phone: '9999988888',
            email: 'walkintest' + Date.now() + '@gmail.com',
            source: 'walk-in',
            assignedStaff: sales._id.toString(),
            followUpDate: followUpDate,
            comments: 'Prospect visited gym today. Wants follow-up call.',
            interests: 'Strength Training',
            budget: '5000/month'
        })
    });

    console.log("Enquiry Submit status:", submitRes.status);
    const submitData = (await submitRes.json()) as any;
    console.log("Response data:", submitData);

    if (!submitData.success) {
        throw new Error("Failed to create enquiry via API: " + submitData.message);
    }

    const enquiryId = submitData.data?._id;
    console.log(`Created Enquiry ID: ${enquiryId}`);

    // 4. Verify that a follow-up was automatically scheduled for the Sales staff
    console.log("\n--- Step 2: Verify automatic FollowUp task in DB ---");
    const followUp = await db.collection('followups').findOne({
        relatedId: new mongoose.Types.ObjectId(enquiryId),
        type: 'enquiry'
    });

    if (!followUp) {
        throw new Error("Verification Failed: No FollowUp document automatically created!");
    }

    console.log("Success! Found automatically created FollowUp:", {
        id: followUp._id,
        assignedTo: followUp.assignedTo.toString(),
        relatedName: followUp.relatedName,
        status: followUp.status,
        note: followUp.note,
        scheduledDate: followUp.scheduledDate,
        scheduledTime: followUp.scheduledTime
    });

    // 5. Verify that a calendar schedule event was created
    console.log("\n--- Step 3: Verify automatic Schedule event in DB ---");
    const scheduleEvent = await db.collection('schedules').findOne({
        relatedFollowUp: followUp._id
    });

    if (!scheduleEvent) {
        throw new Error("Verification Failed: No corresponding calendar Schedule event created!");
    }

    console.log("Success! Found calendar Schedule event:", {
        id: scheduleEvent._id,
        title: scheduleEvent.title,
        description: scheduleEvent.description,
        type: scheduleEvent.type
    });

    // 6. Verify that a notification was dispatched to the sales staff's user ID
    console.log("\n--- Step 4: Verify Notification in DB ---");
    const notification = await db.collection('notifications').findOne({
        recipientId: new mongoose.Types.ObjectId(sales.userId.toString()),
        type: 'follow_up_due'
    });

    if (!notification) {
        throw new Error("Verification Failed: Sales staff did not receive a notification!");
    }

    console.log("Success! Found assignment Notification:", {
        id: notification._id,
        recipientId: notification.recipientId,
        title: notification.title,
        message: notification.message
    });

    // Clean up test data
    console.log("\n--- Cleaning up test records ---");
    await db.collection('enquiries').deleteOne({ _id: new mongoose.Types.ObjectId(enquiryId) });
    await db.collection('followups').deleteOne({ _id: followUp._id });
    await db.collection('schedules').deleteOne({ _id: scheduleEvent._id });
    await db.collection('notifications').deleteOne({ _id: notification._id });
    console.log("Cleanup complete!");

    await mongoose.disconnect();
    console.log("Verification finished successfully!");
}

run().catch(async (err) => {
    console.error("Verification failed:", err);
    await mongoose.disconnect();
});
