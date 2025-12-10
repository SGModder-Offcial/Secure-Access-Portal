import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { connectDB } from "./db";
import { Admin, SearchHistory } from "./models";
import { requireAuth, requireOwner, detectVPN, securityHeaders, preventInterception } from "./middleware";

const OWNER_USERNAME = process.env.OWNER_USERNAME || "";
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "super-secret-session-key-change-in-production";

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
      resave: true,
      saveUninitialized: false,
      rolling: true, // Refresh session on each request
      proxy: true, // Required for Render/Railway behind proxy
      store: new MemoryStoreSession({
        checkPeriod: 86400000,
      }),
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 30 * 60 * 1000, // 30 minutes
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      },
    })
  );

  app.use(securityHeaders);
  app.use(preventInterception);

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
      const { username, password, loginType } = req.body;

      if (!username || !password || !loginType) {
        return res.status(400).json({ success: false, error: "Missing credentials" });
      }

      if (loginType === "owner") {
        if (username === OWNER_USERNAME && password === OWNER_PASSWORD) {
          req.session.user = {
            id: "owner",
            username: OWNER_USERNAME,
            name: "System Owner",
            role: "owner",
          };
          return res.json({
            success: true,
            user: req.session.user,
          });
        }
        return res.status(401).json({ success: false, error: "Invalid owner credentials" });
      }

      if (loginType === "admin") {
        const admin = await Admin.findOne({ username, status: "active" });
        if (!admin) {
          return res.status(401).json({ success: false, error: "Invalid credentials or account inactive" });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
          return res.status(401).json({ success: false, error: "Invalid credentials" });
        }

        admin.lastLogin = new Date();
        await admin.save();

        req.session.user = {
          id: admin._id.toString(),
          username: admin.username,
          name: admin.name,
          role: "admin",
        };

        return res.json({
          success: true,
          user: req.session.user,
        });
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
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });

  app.get("/api/owner/stats", requireOwner, detectVPN, async (req: Request, res: Response) => {
    try {
      const totalAdmins = await Admin.countDocuments();
      const activeAdmins = await Admin.countDocuments({ status: "active" });
      const recentSearches = await SearchHistory.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      return res.json({
        success: true,
        totalAdmins,
        activeAdmins,
        recentSearches,
      });
    } catch (error) {
      console.error("Stats error:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch stats" });
    }
  });

  app.get("/api/owner/admins", requireOwner, detectVPN, async (req: Request, res: Response) => {
    try {
      const admins = await Admin.find().select("-password").sort({ createdAt: -1 });
      return res.json(admins);
    } catch (error) {
      console.error("Fetch admins error:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch admins" });
    }
  });

  app.post("/api/owner/admins", requireOwner, detectVPN, async (req: Request, res: Response) => {
    try {
      const { username, password, name, email, status } = req.body;

      if (!username || !password || !name || !email) {
        return res.status(400).json({ success: false, error: "All fields are required" });
      }

      const existingAdmin = await Admin.findOne({
        $or: [{ username }, { email }],
      });

      if (existingAdmin) {
        return res.status(400).json({ success: false, error: "Username or email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const admin = new Admin({
        username,
        password: hashedPassword,
        name,
        email,
        status: status || "active",
      });

      await admin.save();

      const adminResponse = admin.toObject();
      delete adminResponse.password;

      return res.status(201).json({ success: true, admin: adminResponse });
    } catch (error) {
      console.error("Create admin error:", error);
      return res.status(500).json({ success: false, error: "Failed to create admin" });
    }
  });

  app.put("/api/owner/admins/:id", requireOwner, detectVPN, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { username, password, name, email, status } = req.body;

      const admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({ success: false, error: "Admin not found" });
      }

      if (username && username !== admin.username) {
        const existing = await Admin.findOne({ username });
        if (existing) {
          return res.status(400).json({ success: false, error: "Username already exists" });
        }
        admin.username = username;
      }

      if (email && email !== admin.email) {
        const existing = await Admin.findOne({ email });
        if (existing) {
          return res.status(400).json({ success: false, error: "Email already exists" });
        }
        admin.email = email;
      }

      if (name) admin.name = name;
      if (status) admin.status = status;

      if (password) {
        admin.password = await bcrypt.hash(password, 12);
      }

      await admin.save();

      const adminResponse = admin.toObject();
      delete adminResponse.password;

      return res.json({ success: true, admin: adminResponse });
    } catch (error) {
      console.error("Update admin error:", error);
      return res.status(500).json({ success: false, error: "Failed to update admin" });
    }
  });

  app.delete("/api/owner/admins/:id", requireOwner, detectVPN, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await Admin.findByIdAndDelete(id);
      if (!result) {
        return res.status(404).json({ success: false, error: "Admin not found" });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete admin error:", error);
      return res.status(500).json({ success: false, error: "Failed to delete admin" });
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

  app.get("/api/search/id", requireAuth, searchLimiter, detectVPN, (req, res) => {
    searchHandler("id", "id", req, res);
  });

  return httpServer;
}
