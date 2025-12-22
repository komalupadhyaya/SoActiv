
import mongoose from "mongoose";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/soActiveTest";

console.log("Connecting to:", MONGODB_URI);

const userSchema = new mongoose.Schema({
    fullname: String,
    email: String,
    phone: String,
    role: String,
    avatar: String
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function checkUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        const email = "chiragsoftiatric@gmail.com";
        const user = await User.findOne({ email });

        if (user) {
            console.log("User Found:");
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log("User NOT found:", email);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
