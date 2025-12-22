
import mongoose from "mongoose";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/soActiveTest";

const userSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    phone: String,
    role: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function fixUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        const email = "chiragsoftiatric@gmail.com";
        const user = await User.findOne({ email });

        if (user) {
            console.log("Before Fix:", user.fullname, user.phone);

            user.fullname = "Chirag";
            user.phone = ""; // Reset phone to empty

            await user.save();
            console.log("After Fix:", user.fullname, user.phone);
            console.log("✅ User repaired successfully.");
        } else {
            console.log("User NOT found:", email);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

fixUser();
