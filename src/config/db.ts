import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI!;
if (!mongoUri) {
  throw new Error("MONGO_URI is not defined");
}

let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, { bufferCommands: false }).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  console.log("MongoDB connected");
  return cached.conn;
};

export default connectDB;
