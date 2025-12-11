import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { connectDB } from "./db";
import { User, SearchHistory, ALL_FEATURES } from "./models";
import { requireAuth, requireAdmin, detectVPN, securityHeaders, preventInterception, apiProtection } from "./middleware";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "super-secret-session-key-change-in-production";

// Input validation helpers to prevent NoSQL injection
function sanitizeString(input: any): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, 500);
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,50}$/.test(username);
}

function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.length >= 6 && password.length <= 100;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255;
}

const API_BASE = "https://numinfoapi.vercel.app";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await connectDB();

  // Trust proxy for Render/Railway/etc deployments
  app.set('trust proxy', 1);

  const MemoryStoreSession = MemoryStore(session);

  const isProduction = process.env.NODE_ENV === "production";
  
  app.use(
    session({
      name: "sid",
      secret: SESSION_SECRET,
      resave: false, // Don't save session if not modified
      saveUninitialized: false,
      rolling: true, // Refresh session on each request
      proxy: true, // Required for Render/Railway behind proxy
      store: new MemoryStoreSession({
        checkPeriod: 86400000,
      }),
      cookie: {
        secure: isProduction, // Only send over HTTPS in production
        httpOnly: true, // Prevents client-side JS from accessing cookie
        maxAge: 30 * 60 * 1000, // 30 minutes
        sameSite: isProduction ? "strict" : "lax", // CSRF protection
        path: "/",
      },
    })
  );

  app.use(securityHeaders);
  app.use(preventInterception);
  app.use(apiProtection);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: "Too many login attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const searchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { success: false, error: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.post("/api/auth/login", authLimiter, detectVPN, async (req: Request, res: Response) => {
    try {
      const username = sanitizeString(req.body.username);
      const password = sanitizeString(req.body.password);
      const loginType = sanitizeString(req.body.loginType);

      if (!username || !password || !loginType) {
        return res.status(400).json({ success: false, error: "Missing credentials" });
      }

      // Validate input types to prevent NoSQL injection
      if (typeof req.body.username !== "string" || typeof req.body.password !== "string") {
        return res.status(400).json({ success: false, error: "Invalid input format" });
      }

      if (loginType === "admin") {
        // Prevent login with empty admin credentials
        if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
          console.error("Admin credentials not configured");
          return res.status(401).json({ success: false, error: "Invalid admin credentials" });
        }
        
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          // Regenerate session to prevent session fixation
          req.session.regenerate((err) => {
            if (err) {
              console.error("Session regeneration error:", err);
              return res.status(500).json({ success: false, error: "Login failed" });
            }
            req.session.user = {
              id: "admin",
              username: ADMIN_USERNAME,
              name: "System Admin",
              role: "admin",
            };
            return res.json({
              success: true,
              user: req.session.user,
            });
          });
          return;
        }
        return res.status(401).json({ success: false, error: "Invalid admin credentials" });
      }

      if (loginType === "user") {
        // Use string explicitly to prevent NoSQL injection with objects
        const user = await User.findOne({ username: String(username), status: "active" });
        if (!user) {
          return res.status(401).json({ success: false, error: "Invalid credentials or account inactive" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ success: false, error: "Invalid credentials" });
        }

        user.lastLogin = new Date();
        await user.save();

        // Regenerate session to prevent session fixation
        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regeneration error:", err);
            return res.status(500).json({ success: false, error: "Login failed" });
          }
          req.session.user = {
            id: user._id.toString(),
            username: user.username,
            name: user.name,
            role: "user",
          };

          return res.json({
            success: true,
            user: req.session.user,
          });
        });
        return;
      }

      return res.status(400).json({ success: false, error: "Invalid login type" });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ success: false, error: "Login failed" });
    }
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (req.session?.user) {
      return res.json({ success: true, user: req.session.user });
    }
    return res.status(401).json({ success: false, error: "Not authenticated" });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Logout failed" });
      }
      // Clear the correct session cookie name
      res.clearCookie("sid");
      return res.json({ success: true });
    });
  });

  app.get("/api/admin/stats", requireAdmin, detectVPN, async (req: Request, res: Response) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ status: "active" });
      const recentSearches = await SearchHistory.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      return res.json({
        success: true,
        totalUsers,
        activeUsers,
        recentSearches,
      });
    } catch (error) {
      console.error("Stats error:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", requireAdmin, detectVPN, async (req: Request, res: Response) => {
    try {
      const users = await User.find().select("-password").sort({ createdAt: -1 });
      return res.json(users);
    } catch (error) {
      console.error("Fetch users error:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAdmin, detectVPN, async (req: Request, res: Response) => {
    try {
      const username = sanitizeString(req.body.username);
      const password = sanitizeString(req.body.password);
      const name = sanitizeString(req.body.name);
      const email = sanitizeString(req.body.email);
      const status = sanitizeString(req.body.status);

      if (!username || !password || !name || !email) {
        return res.status(400).json({ success: false, error: "All fields are required" });
      }

      // Validate input formats
      if (!isValidUsername(username)) {
        return res.status(400).json({ success: false, error: "Username must be 3-50 alphanumeric characters or underscores" });
      }

      if (!isValidPassword(password)) {
        return res.status(400).json({ success: false, error: "Password must be 6-100 characters" });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, error: "Invalid email format" });
      }

      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({ success: false, error: "Name must be 2-100 characters" });
      }

      const existingUser = await User.findOne({
        $or: [{ username: String(username) }, { email: String(email) }],
      });

      if (existingUser) {
        return res.status(400).json({ success: false, error: "Username or email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = new User({
        username: String(username),
        password: hashedPassword,
        name: String(name),
        email: String(email),
        status: status === "inactive" ? "inactive" : "active",
      });

      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;

      return res.status(201).json({ success: true, user: userResponse });
    } catch (error) {
      console.error("Create user error:", error);
      return res.status(500).json({ success: false, error: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", requireAdmin, detectVPN, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { username, password, name, email, status } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      if (username && username !== user.username) {
        const existing = await User.findOne({ username });
        if (existing) {
          return res.status(400).json({ success: false, error: "Username already exists" });
        }
        user.username = username;
      }

      if (email && email !== user.email) {
        const existing = await User.findOne({ email });
        if (existing) {
          return res.status(400).json({ success: false, error: "Email already exists" });
        }
        user.email = email;
      }

      if (name) user.name = name;
      if (status) user.status = status;

      if (password) {
        user.password = await bcrypt.hash(password, 12);
      }

      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;

      return res.json({ success: true, user: userResponse });
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ success: false, error: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, detectVPN, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await User.findByIdAndDelete(id);
      if (!result) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ success: false, error: "Failed to delete user" });
    }
  });

  app.get("/api/admin/users/:id/details", requireAdmin, detectVPN, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select("-password");
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      const searchHistory = await SearchHistory.find({ userId: id }).sort({ timestamp: -1 });
      
      const searchStats = {
        total: searchHistory.length,
        mobile: searchHistory.filter(s => s.searchType === "mobile").length,
        email: searchHistory.filter(s => s.searchType === "email").length,
        aadhar: searchHistory.filter(s => s.searchType === "aadhar").length,
        pan: searchHistory.filter(s => s.searchType === "pan").length,
        vehicleInfo: searchHistory.filter(s => s.searchType === "vehicle_info").length,
        vehicleChallan: searchHistory.filter(s => s.searchType === "vehicle_challan").length,
      };

      return res.json({
        success: true,
        user,
        searchHistory,
        searchStats,
        allFeatures: ALL_FEATURES,
      });
    } catch (error) {
      console.error("Get user details error:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch user details" });
    }
  });

  app.put("/api/admin/users/:id/features", requireAdmin, detectVPN, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { features } = req.body;

      if (!Array.isArray(features)) {
        return res.status(400).json({ success: false, error: "Features must be an array" });
      }

      const validFeatures = features.filter(f => ALL_FEATURES.includes(f));

      const user = await User.findByIdAndUpdate(
        id,
        { features: validFeatures },
        { new: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      return res.json({ success: true, user });
    } catch (error) {
      console.error("Update user features error:", error);
      return res.status(500).json({ success: false, error: "Failed to update features" });
    }
  });

  app.get("/api/user/features", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId || userId === "admin") {
        return res.json({ success: true, features: ALL_FEATURES });
      }

      const user = await User.findById(userId).select("features");
      if (!user) {
        return res.json({ success: true, features: ALL_FEATURES });
      }

      return res.json({ success: true, features: user.features || ALL_FEATURES });
    } catch (error) {
      console.error("Get user features error:", error);
      return res.json({ success: true, features: ALL_FEATURES });
    }
  });

  const searchHandler = async (type: string, queryParam: string, req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ success: false, error: "Query parameter required" });
      }

      const apiUrl = `${API_BASE}/search?${queryParam}=${encodeURIComponent(query)}`;
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "SecurePortal/1.0",
          "Accept": "application/json",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const data = await response.json();

      const user = req.session?.user;
      if (user) {
        await SearchHistory.create({
          userId: user.id,
          userType: user.role,
          searchType: type as any,
          searchQuery: query,
          resultCount: Array.isArray(data) ? data.length : (data ? 1 : 0),
        });
      }

      return res.json({ success: true, data });
    } catch (error: any) {
      console.error(`Search ${type} error:`, error.message);
      if (error.name === "AbortError") {
        return res.status(504).json({ success: false, error: "Search request timed out" });
      }
      return res.status(500).json({ success: false, error: "Search failed" });
    }
  };

  app.get("/api/search/mobile", requireAuth, searchLimiter, detectVPN, async (req: Request, res: Response) => {
    try {
      const query = req.query.query as string;
      if (!query) {
        return res.status(400).json({ success: false, error: "Query parameter required" });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const [mobileRes, altRes] = await Promise.allSettled([
        fetch(`${API_BASE}/search?mobile=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          headers: { "User-Agent": "SecurePortal/1.0", "Accept": "application/json" },
        }),
        fetch(`${API_BASE}/search?alt=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          headers: { "User-Agent": "SecurePortal/1.0", "Accept": "application/json" },
        }),
      ]);

      clearTimeout(timeout);

      let allResults: any[] = [];

      if (mobileRes.status === "fulfilled" && mobileRes.value.ok) {
        const mobileData = await mobileRes.value.json();
        if (Array.isArray(mobileData)) {
          allResults.push(...mobileData);
        } else if (mobileData && typeof mobileData === "object") {
          allResults.push(mobileData);
        }
      }

      if (altRes.status === "fulfilled" && altRes.value.ok) {
        const altData = await altRes.value.json();
        if (Array.isArray(altData)) {
          allResults.push(...altData);
        } else if (altData && typeof altData === "object") {
          allResults.push(altData);
        }
      }

      const uniqueResults = allResults.filter((item, idx, arr) => {
        const key = JSON.stringify(item);
        return arr.findIndex((i) => JSON.stringify(i) === key) === idx;
      });

      const user = req.session?.user;
      if (user) {
        await SearchHistory.create({
          userId: user.id,
          userType: user.role,
          searchType: "mobile",
          searchQuery: query,
          resultCount: uniqueResults.length,
        });
      }

      return res.json({ success: true, data: uniqueResults });
    } catch (error: any) {
      console.error("Mobile search error:", error.message);
      if (error.name === "AbortError") {
        return res.status(504).json({ success: false, error: "Search request timed out" });
      }
      return res.status(500).json({ success: false, error: "Search failed" });
    }
  });

  app.get("/api/search/email", requireAuth, searchLimiter, detectVPN, (req, res) => {
    searchHandler("email", "email", req, res);
  });

  app.get("/api/search/aadhar", requireAuth, searchLimiter, detectVPN, (req, res) => {
    searchHandler("aadhar", "id", req, res);
  });

  app.get("/api/search/pan", requireAuth, searchLimiter, detectVPN, (req, res) => {
    searchHandler("pan", "id", req, res);
  });

  // Vehicle Challan Search API
  const VEHICLE_API_BASE = "https://osint-apis.zerovault.workers.dev";
  const VEHICLE_API_KEY = "prateek";

  app.get("/api/search/vehicle-challan", requireAuth, searchLimiter, detectVPN, async (req: Request, res: Response) => {
    try {
      const vehicleNumber = sanitizeString(req.query.query as string);
      if (!vehicleNumber) {
        return res.status(400).json({ success: false, error: "There are some problem please contact developer" });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const apiUrl = `${VEHICLE_API_BASE}/?api_key=${VEHICLE_API_KEY}&service=challan&vehicle_number=${encodeURIComponent(vehicleNumber)}`;
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "SecurePortal/1.0",
          "Accept": "application/json",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`Vehicle challan API error: ${response.status}`);
        return res.status(200).json({ success: true, data: null, message: "There are some problem please contact developer" });
      }

      const rawData = await response.json();
      
      // Filter out metadata/credits - only keep vehicle-related data
      // Explicitly exclude: metadata, api_by, channel, telegram, api_input, api_output, api_credit
      const filteredData: any = {};
      if (rawData.challan && rawData.challan.status === 200) {
        filteredData.challan = rawData.challan;
      }
      if (rawData.vehicle_number) {
        filteredData.vehicle_number = rawData.vehicle_number;
      }
      // Do NOT include: metadata, timestamp, api_by, channel, telegram info, api_input, api_output, api_credit

      // If no valid data found, return generic error
      if (!filteredData.challan) {
        return res.status(200).json({ success: true, data: null, message: "There are some problem please contact developer" });
      }

      const user = req.session?.user;
      if (user) {
        await SearchHistory.create({
          userId: user.id,
          userType: user.role,
          searchType: "vehicle_challan",
          searchQuery: vehicleNumber,
          resultCount: filteredData.challan?.data?.data?.length || 0,
        });
      }

      return res.json({ success: true, data: filteredData });
    } catch (error: any) {
      console.error("Vehicle challan search error:", error.message);
      return res.status(200).json({ success: true, data: null, message: "There are some problem please contact developer" });
    }
  });

  // Vehicle Info Search API
  app.get("/api/search/vehicle-info", requireAuth, searchLimiter, detectVPN, async (req: Request, res: Response) => {
    try {
      const vehicleNumber = sanitizeString(req.query.query as string);
      if (!vehicleNumber) {
        return res.status(400).json({ success: false, error: "There are some problem please contact developer" });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const apiUrl = `${VEHICLE_API_BASE}/?api_key=${VEHICLE_API_KEY}&service=vehicle-puc&vehicle_number=${encodeURIComponent(vehicleNumber)}`;
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "SecurePortal/1.0",
          "Accept": "application/json",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`Vehicle info API error: ${response.status}`);
        return res.status(200).json({ success: true, data: null, message: "There are some problem please contact developer" });
      }

      const rawData = await response.json();
      
      // Filter out metadata/credits - only keep vehicle-related data
      // Explicitly exclude: metadata, api_by, channel, telegram, api_input, api_output, api_credit, timestamp
      const filteredData: any = {};
      if (rawData.vehicle && rawData.vehicle.status === 200) {
        filteredData.vehicle = rawData.vehicle;
      }
      if (rawData.puc && rawData.puc.status === 200) {
        filteredData.puc = rawData.puc;
      }
      if (rawData.vehicle_number) {
        filteredData.vehicle_number = rawData.vehicle_number;
      }
      // Do NOT include: metadata, timestamp, api_by, channel, telegram info, api_input, api_output, api_credit

      // If no valid vehicle data found, return generic error
      if (!filteredData.vehicle) {
        return res.status(200).json({ success: true, data: null, message: "There are some problem please contact developer" });
      }

      const user = req.session?.user;
      if (user) {
        await SearchHistory.create({
          userId: user.id,
          userType: user.role,
          searchType: "vehicle_info",
          searchQuery: vehicleNumber,
          resultCount: filteredData.vehicle ? 1 : 0,
        });
      }

      return res.json({ success: true, data: filteredData });
    } catch (error: any) {
      console.error("Vehicle info search error:", error.message);
      return res.status(200).json({ success: true, data: null, message: "There are some problem please contact developer" });
    }
  });

  // IP Geolocation Search using ip-api.com (free, no API key required)
  app.get("/api/search/ip", requireAuth, searchLimiter, detectVPN, async (req: Request, res: Response) => {
    try {
      const ipAddress = sanitizeString(req.query.query as string);
      if (!ipAddress) {
        return res.status(400).json({ success: false, error: "IP address is required" });
      }

      // Basic IP validation (IPv4 or IPv6)
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^([0-9a-fA-F]{1,4}:){0,6}::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$/;
      
      if (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
        return res.status(400).json({ success: false, error: "Invalid IP address format" });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      // Using ip-api.com - free API, no key required, 45 req/min limit
      const apiUrl = `http://ip-api.com/json/${encodeURIComponent(ipAddress)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "SecurePortal/1.0",
          "Accept": "application/json",
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`IP API error: ${response.status}`);
        return res.status(500).json({ success: false, error: "IP lookup failed" });
      }

      const data = await response.json();
      
      // ip-api.com returns status: "fail" on errors
      if (data.status === "fail") {
        return res.status(400).json({ success: false, error: data.message || "Invalid IP address or lookup failed" });
      }

      const user = req.session?.user;
      if (user) {
        await SearchHistory.create({
          userId: user.id,
          userType: user.role,
          searchType: "ip",
          searchQuery: ipAddress,
          resultCount: data.status === "success" ? 1 : 0,
        });
      }

      return res.json({ success: true, data });
    } catch (error: any) {
      console.error("IP search error:", error.message);
      if (error.name === "AbortError") {
        return res.status(504).json({ success: false, error: "IP lookup request timed out" });
      }
      return res.status(500).json({ success: false, error: "IP lookup failed" });
    }
  });

  return httpServer;
}
