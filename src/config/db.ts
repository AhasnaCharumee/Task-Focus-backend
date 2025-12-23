import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/taskfocus";
console.log("[DEBUG] MONGO_URI:", mongoUri);

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
