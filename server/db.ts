import mongoose from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL || "";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  if (!MONGODB_URL) {
    console.error("MONGODB_URL not set in environment variables");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URL, {
      dbName: "secure_portal",
    });
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export function getConnectionStatus(): boolean {
  return isConnected;
}
