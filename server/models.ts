import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
  _id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  createdAt: Date;
  lastLogin?: Date;
}

const adminSchema = new Schema<IAdmin>({
  username: { type: String, required: true, unique: true, minlength: 3 },
  password: { type: String, required: true, minlength: 4 },
  name: { type: String, required: true, minlength: 2 },
  email: { type: String, required: true, unique: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
});

export interface ISearchHistory extends Document {
  userId: string;
  userType: "owner" | "admin";
  searchType: "mobile" | "email" | "aadhar" | "pan" | "alt" | "vehicle_challan" | "vehicle_info";
  searchQuery: string;
  resultCount: number;
  timestamp: Date;
}

const searchHistorySchema = new Schema<ISearchHistory>({
  userId: { type: String, required: true },
  userType: { type: String, enum: ["owner", "admin"], required: true },
  searchType: { type: String, enum: ["mobile", "email", "aadhar", "pan", "alt", "vehicle_challan", "vehicle_info"], required: true },
  searchQuery: { type: String, required: true },
  resultCount: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

export const Admin = mongoose.models.Admin || mongoose.model<IAdmin>("Admin", adminSchema);
export const SearchHistory = mongoose.models.SearchHistory || mongoose.model<ISearchHistory>("SearchHistory", searchHistorySchema);
