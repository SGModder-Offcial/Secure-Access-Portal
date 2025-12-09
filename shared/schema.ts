import { z } from "zod";

// Admin user schema for MongoDB
export const adminSchema = z.object({
  _id: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  status: z.enum(["active", "inactive"]).default("active"),
  createdAt: z.date().optional(),
  lastLogin: z.date().optional(),
});

export const insertAdminSchema = adminSchema.omit({ _id: true, createdAt: true, lastLogin: true });
export const updateAdminSchema = adminSchema.partial().omit({ _id: true, createdAt: true });

export type Admin = z.infer<typeof adminSchema>;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type UpdateAdmin = z.infer<typeof updateAdminSchema>;

// Search history schema
export const searchHistorySchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  userType: z.enum(["owner", "admin"]),
  searchType: z.enum(["mobile", "email", "id", "alt"]),
  searchQuery: z.string(),
  resultCount: z.number().default(0),
  timestamp: z.date().optional(),
});

export type SearchHistory = z.infer<typeof searchHistorySchema>;

// Login schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  loginType: z.enum(["owner", "admin"]),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Session user type
export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: "owner" | "admin";
}

// Search result type
export interface SearchResult {
  success: boolean;
  data?: any;
  error?: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
