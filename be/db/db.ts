import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // 🔥 Now MONGODB_URI includes the DB name
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI!);
    
    console.log(`✅ DB Connected: ${connectionInstance.connection.host}`);
    console.log(`📁 Database: ${connectionInstance.connection.name}`);
  } catch (error: any) {
    console.log(`❌ DB Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;