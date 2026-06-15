import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model';

dotenv.config({ path: 'c:/Users/User/SoActiv/be/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soActive';

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    const usersToReset = ['tusharkkynr@gmail.com', 'komalsoftiatric@gmail.com', 'justin@gmail.com'];

    for (const email of usersToReset) {
        const user = await User.findOne({ email });
        if (user) {
            // Set as plain text password so Mongoose hook hashes it exactly once
            user.password = '123456';
            await user.save();
            console.log(`Successfully reset and single-hashed password for ${email} to '123456'`);
        } else {
            console.log(`User ${email} not found`);
        }
    }

    await mongoose.disconnect();
}

run().catch(console.error);
