import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: 'c:/Users/User/SoActiv/be/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soActive';
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-super-secret-jwt-key';

// Member finn@gmail.com, gym is Max: 6a0d3e21b0c9502347ff55ae
const memberToken = jwt.sign(
    {
        _id: '6a212a4f4c3269b1719035bd',
        role: 'member',
        gym: '6a0d3e21b0c9502347ff55ae'
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
);

// Gym Admin justin@gmail.com, gym is Max: 6a0d3e21b0c9502347ff55ae
const gymAdminToken = jwt.sign(
    {
        _id: '6a0d3e21b0c9502347ff55af',
        role: 'admin',
        gym: '6a0d3e21b0c9502347ff55ae'
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
);

// Another Gym Admin abhi@gmail.com, gym is Pro Gym: 6a0c624eb0c9502347ff54ce
const otherGymAdminToken = jwt.sign(
    {
        _id: '6a0c624eb0c9502347ff54cf',
        role: 'admin',
        gym: '6a0c624eb0c9502347ff54ce'
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
);

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

    // Clean up old support messages from this member to have a clean test
    if (mongoose.connection.db) {
        await mongoose.connection.db.collection('contacts').deleteMany({
            email: 'finn@gmail.com'
        });
        console.log("Cleaned up old contacts for finn@gmail.com");
    }

    // 0. Get Super Admin stats BEFORE ticket creation
    const statsBeforeRes = await fetch('http://localhost:8000/api/v1/contact/superadmin/stats', {
        headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const statsBefore = (await statsBeforeRes.json()) as any;
    const initialUnreadCount = statsBefore.data?.unreadCount || 0;
    console.log("Super Admin initial unread stats count:", initialUnreadCount);

    // 1. Submit support ticket as member
    console.log("\n--- Step 1: Submit support ticket as member ---");
    const submitRes = await fetch('http://localhost:8000/api/v1/contact', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${memberToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'Finn Member',
            email: 'finn@gmail.com',
            category: 'billing',
            message: 'Hello, I have a billing issue with my membership renewal. please assist!'
        })
    });
    console.log("Submit ticket status:", submitRes.status);
    const submitData = (await submitRes.json()) as any;
    console.log("Submit ticket response:", submitData);

    const ticketId = submitData.data?._id;
    if (!ticketId) {
        throw new Error("Failed to create ticket");
    }

    // 1.5. Verify Super Admin does NOT see this ticket or count it
    console.log("\n--- Step 1.5: Verify Super Admin endpoints exclude this ticket ---");
    
    // Check Stats
    const statsAfterRes = await fetch('http://localhost:8000/api/v1/contact/superadmin/stats', {
        headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const statsAfter = (await statsAfterRes.json()) as any;
    console.log("Super Admin stats count after member ticket creation:", statsAfter.data?.unreadCount);
    console.log("Stats count increased?", statsAfter.data?.unreadCount > initialUnreadCount);
    
    // Check List
    const superAdminListRes = await fetch('http://localhost:8000/api/v1/contact/superadmin/list', {
        headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const superAdminListData = (await superAdminListRes.json()) as any;
    const foundMessageInSuperAdmin = superAdminListData.data?.find((m: any) => m._id === ticketId);
    console.log("Is member ticket visible in Super Admin list?", !!foundMessageInSuperAdmin);

    // 2. Fetch support messages as the member's gym admin
    console.log("\n--- Step 2: Fetch support messages as member's Gym Admin ---");
    const fetchRes = await fetch('http://localhost:8000/api/v1/contact/gym/list', {
        headers: { 'Authorization': `Bearer ${gymAdminToken}` }
    });
    console.log("Fetch tickets status:", fetchRes.status);
    const fetchData = (await fetchRes.json()) as any;
    console.log("Fetched messages count:", fetchData.data?.length);
    const foundMessage = fetchData.data?.find((m: any) => m._id === ticketId);
    console.log("Found our ticket in list?", !!foundMessage);
    if (foundMessage) {
        console.log("Ticket details:", {
            name: foundMessage.name,
            source: foundMessage.source,
            gymId: foundMessage.gymId,
            status: foundMessage.status,
            message: foundMessage.message
        });
    }

    // 3. Fetch support messages as another gym admin (Tenant Isolation Check)
    console.log("\n--- Step 3: Fetch support messages as another Gym Admin (Isolation Check) ---");
    const fetchOtherRes = await fetch('http://localhost:8000/api/v1/contact/gym/list', {
        headers: { 'Authorization': `Bearer ${otherGymAdminToken}` }
    });
    console.log("Fetch other tickets status:", fetchOtherRes.status);
    const fetchOtherData = (await fetchOtherRes.json()) as any;
    const foundMessageInOther = fetchOtherData.data?.find((m: any) => m._id === ticketId);
    console.log("Is ticket visible to other gym admin?", !!foundMessageInOther);

    // 4. Update support ticket status as gym admin
    console.log("\n--- Step 4: Update status to 'read' as Gym Admin ---");
    const updateRes = await fetch(`http://localhost:8000/api/v1/contact/gym/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${gymAdminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'read' })
    });
    console.log("Update ticket status response code:", updateRes.status);
    const updateData = (await updateRes.json()) as any;
    console.log("Updated status:", updateData.data?.status);

    // 5. Attempt to update ticket status as another gym admin (Tenant Isolation Write Check)
    console.log("\n--- Step 5: Attempt to update ticket status as another Gym Admin (Isolation Write Check) ---");
    const updateOtherRes = await fetch(`http://localhost:8000/api/v1/contact/gym/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${otherGymAdminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'closed' })
    });
    console.log("Update ticket status as other admin response code:", updateOtherRes.status);
    const updateOtherData = (await updateOtherRes.json()) as any;
    console.log("Update response message:", updateOtherData.message);

    await mongoose.disconnect();
}

run().catch(console.error);
