import { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      name: string;
      role: "owner" | "admin";
    };
  }
}

// Allowed origins for API access
const ALLOWED_ORIGINS = [
  "https://secure-access-portal.onrender.com",
  "http://localhost:5000",
  "http://0.0.0.0:5000",
  "https://localhost",
];

// Block direct API access from other domains/tools
export function apiProtection(req: Request, res: Response, next: NextFunction) {
  // Only apply protection to API routes
  if (!req.path.startsWith("/api/")) {
    return next();
  }
  
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // Allow same-origin requests (no origin header means same-origin)
  if (!origin && !referer) {
    // Could be direct browser access or curl - check if it's an API route
    if (req.path.startsWith("/api/") && req.path !== "/api/auth/me") {
      // Block direct API calls without proper headers
      const userAgent = (req.headers["user-agent"] || "").toLowerCase();
      const isBrowser = userAgent.includes("mozilla") || userAgent.includes("chrome") || userAgent.includes("safari");
      
      if (!isBrowser) {
        return res.status(403).json({
          success: false,
          error: "Direct API access not allowed",
          code: "API_ACCESS_DENIED"
        });
      }
    }
  }
  
  // Check origin if present
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed)) || 
                      origin.includes("replit.dev") || 
                      origin.includes("replit.app") ||
                      origin.includes("repl.co");
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        error: "Origin not allowed",
        code: "CORS_BLOCKED"
      });
    }
  }
  
  // Check referer if present
  if (referer) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed)) || 
                      referer.includes("replit.dev") || 
                      referer.includes("replit.app") ||
                      referer.includes("repl.co");
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        error: "Invalid request source",
        code: "REFERER_BLOCKED"
      });
    }
  }
  
  // Add CORS headers for allowed origins
  const isOriginAllowed = origin && (
    ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed)) || 
    origin.includes("replit.dev") || 
    origin.includes("replit.app") ||
    origin.includes("repl.co")
  );
  if (isOriginAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  next();
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  if (req.session.user.role !== "owner") {
    return res.status(403).json({ success: false, error: "Forbidden - Owner access required" });
  }
  next();
}

// Extended VPN/Datacenter IP ranges (common VPN providers)
const vpnRanges = [
  // DigitalOcean
  "104.238", "104.131", "104.236", "138.68", "138.197", "142.93", "157.230", "159.65", "159.89",
  "161.35", "162.243", "164.90", "165.22", "165.227", "167.71", "167.172", "174.138", "178.62",
  "178.128", "188.166", "192.241", "198.199", "206.189", "209.97",
  // Vultr
  "45.32", "45.63", "45.76", "45.77", "66.42", "95.179", "104.156", "108.61", "140.82", "149.28",
  "155.138", "207.246", "208.167", "209.250", "216.128", "217.69",
  // Linode
  "45.33", "45.56", "45.79", "50.116", "66.175", "69.164", "72.14", "74.207", "96.126", "97.107",
  "139.144", "139.162", "143.42", "170.187", "172.104", "172.105", "173.230", "173.255", "176.58",
  "178.79", "192.46", "194.195", "198.58", "212.71", "213.52",
  // AWS EC2
  "3.0", "3.1", "3.2", "3.5", "3.6", "3.8", "3.9", "3.10", "3.11", "3.12", "3.13", "3.14", "3.15",
  "3.16", "3.17", "3.18", "3.19", "3.20", "3.21", "3.22", "3.23", "3.24", "3.25", "3.26", "3.27",
  "13.48", "13.49", "13.50", "13.51", "13.52", "13.53", "13.54", "13.55", "13.56", "13.57", "13.58",
  "13.112", "13.113", "13.114", "13.124", "13.125", "13.126", "13.127", "13.208", "13.209", "13.210",
  "13.211", "13.212", "13.213", "13.214", "13.228", "13.229", "13.230", "13.231", "13.232", "13.233",
  "13.234", "13.235", "13.236", "13.237", "13.238", "13.239", "13.244", "13.245", "13.246", "13.247",
  "13.248", "13.249", "13.250", "13.251", "18.130", "18.131", "18.132", "18.133", "18.134", "18.135",
  "18.136", "18.138", "18.139", "18.140", "18.141", "18.142", "18.143", "18.144", "18.156", "18.157",
  "18.158", "18.159", "18.162", "18.163", "18.166", "18.167", "18.168", "18.169", "18.170", "18.171",
  "18.175", "18.176", "18.177", "18.178", "18.179", "18.180", "18.181", "18.182", "18.183", "18.184",
  "18.185", "18.188", "18.189", "18.190", "18.191", "18.192", "18.193", "18.194", "18.195", "18.196",
  "18.197", "18.198", "18.199", "18.200", "18.201", "18.202", "18.203", "18.204", "18.205", "18.206",
  "18.207", "18.208", "18.209", "18.210", "18.211", "18.212", "18.213", "18.214", "18.215", "18.216",
  "18.217", "18.218", "18.219", "18.220", "18.221", "18.222", "18.223", "18.224", "18.225", "18.228",
  "18.229", "18.230", "18.231", "18.232", "18.233", "18.234", "18.235", "18.236", "18.237", "18.246",
  "18.252", "18.253", "34.192", "34.193", "34.194", "34.195", "34.196", "34.197", "34.198", "34.199",
  "34.200", "34.201", "34.202", "34.203", "34.204", "34.205", "34.206", "34.207", "34.208", "34.209",
  "34.210", "34.211", "34.212", "34.213", "34.214", "34.215", "34.216", "34.217", "34.218", "34.219",
  "34.220", "34.221", "34.222", "34.223", "34.224", "34.225", "34.226", "34.227", "34.228", "34.229",
  "34.230", "34.231", "34.232", "34.233", "34.234", "34.235", "34.236", "34.237", "34.238", "34.239",
  "34.240", "34.241", "34.242", "34.243", "34.244", "34.245", "34.246", "34.247", "34.248", "34.249",
  "34.250", "34.251", "34.252", "34.253", "34.254", "34.255",
  // Google Cloud
  "34.64", "34.65", "34.66", "34.67", "34.68", "34.69", "34.70", "34.71", "34.72", "34.73", "34.74",
  "34.75", "34.76", "34.77", "34.78", "34.79", "34.80", "34.81", "34.82", "34.83", "34.84", "34.85",
  "34.86", "34.87", "34.88", "34.89", "34.90", "34.91", "34.92", "34.93", "34.94", "34.95", "34.96",
  "34.97", "34.98", "34.99", "34.100", "34.101", "34.102", "34.103", "34.104", "34.105", "34.106",
  "34.107", "34.108", "34.109", "34.110", "34.111", "34.112", "34.113", "34.114", "34.115", "34.116",
  "34.117", "34.118", "34.119", "34.120", "34.121", "34.122", "34.123", "34.124", "34.125", "34.126",
  "34.127", "34.128", "34.129", "34.130", "34.131", "34.132", "34.133", "34.134", "34.135", "34.136",
  "34.137", "34.138", "34.139", "34.140", "34.141", "34.142", "34.143", "34.144", "34.145", "34.146",
  "34.147", "34.148", "34.149", "34.150", "34.151", "34.152", "34.153", "34.154", "34.155", "34.156",
  "34.157", "34.158", "34.159", "34.160", "34.161", "34.162", "34.163", "34.164", "34.165", "34.166",
  "34.167", "34.168", "34.169", "34.170", "34.171", "34.172", "34.173", "34.174", "34.175", "34.176",
  "35.184", "35.185", "35.186", "35.187", "35.188", "35.189", "35.190", "35.191", "35.192", "35.193",
  "35.194", "35.195", "35.196", "35.197", "35.198", "35.199", "35.200", "35.201", "35.202", "35.203",
  "35.204", "35.205", "35.206", "35.207", "35.208", "35.209", "35.210", "35.211", "35.212", "35.213",
  "35.214", "35.215", "35.216", "35.217", "35.218", "35.219", "35.220", "35.221", "35.222", "35.223",
  "35.224", "35.225", "35.226", "35.227", "35.228", "35.229", "35.230", "35.231", "35.232", "35.233",
  "35.234", "35.235", "35.236", "35.237", "35.238", "35.239", "35.240", "35.241", "35.242", "35.243",
  "35.244", "35.245", "35.246", "35.247",
  // NordVPN, ExpressVPN, Surfshark common ranges
  "185.230", "185.231", "185.232", "185.233", "185.234", "185.235", "185.236", "185.237",
  "89.187", "89.238", "91.132", "92.119", "103.86", "146.70", "149.34", "154.47", "169.150",
  "185.93", "185.94", "185.95", "185.156", "185.159", "185.212", "193.29", "193.32", "193.56",
  "194.35", "194.36", "195.206", "196.240", "198.44", "198.54", "199.116", "212.102", "217.138",
  // Hetzner
  "5.9", "46.4", "78.46", "78.47", "88.198", "88.99", "94.130", "95.216", "116.202", "116.203",
  "128.140", "135.181", "136.243", "138.201", "142.132", "144.76", "148.251", "157.90", "159.69",
  "162.55", "167.233", "168.119", "176.9", "178.63", "188.40", "195.201", "213.133", "213.239",
  // OVH
  "51.38", "51.68", "51.75", "51.77", "51.79", "51.81", "51.83", "51.89", "51.91", "51.161",
  "51.178", "51.195", "51.210", "51.222", "54.36", "54.37", "54.38", "54.39", "57.128", "57.129",
  "91.121", "91.134", "92.222", "94.23", "135.125", "137.74", "139.99", "141.94", "141.95", "142.4",
  "142.44", "144.217", "145.239", "147.135", "149.56", "151.80", "158.69", "163.172", "164.132",
  "167.114", "176.31", "178.32", "178.33", "185.15", "188.165", "192.95", "192.99", "193.70", "195.154",
  "198.27", "198.50", "198.100", "198.245", "213.32", "213.186", "213.251", "217.182"
];

// Cache for IP check results (to avoid repeated API calls)
const ipCache = new Map<string, { isVpn: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function detectVPN(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "";
  const forwardedFor = req.headers["x-forwarded-for"] as string;
  const realIp = forwardedFor?.split(",")[0]?.trim() || ip;
  
  // Skip for localhost/private IPs
  if (realIp === "::1" || realIp === "127.0.0.1" || realIp.startsWith("192.168.") || 
      realIp.startsWith("10.") || realIp.startsWith("172.")) {
    return next();
  }

  // Check IP range blocklist
  for (const range of vpnRanges) {
    if (realIp.startsWith(range)) {
      console.log(`VPN/Datacenter IP blocked: ${realIp}`);
      return res.status(403).json({
        success: false,
        error: "VPN/Proxy detected. Please disable VPN to continue.",
        code: "VPN_DETECTED"
      });
    }
  }

  // Check cache
  const cached = ipCache.get(realIp);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    if (cached.isVpn) {
      return res.status(403).json({
        success: false,
        error: "VPN/Proxy detected. Please disable VPN to continue.",
        code: "VPN_DETECTED"
      });
    }
    return next();
  }

  // Use free VPN detection API (vpnapi.io - 1000 free requests/day)
  const VPNAPI_KEY = process.env.VPNAPI_KEY;
  if (VPNAPI_KEY) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`https://vpnapi.io/api/${realIp}?key=${VPNAPI_KEY}`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json();
        const isVpn = data.security?.vpn || data.security?.proxy || data.security?.tor || data.security?.relay;
        
        ipCache.set(realIp, { isVpn, timestamp: Date.now() });
        
        if (isVpn) {
          console.log(`VPN detected via API: ${realIp}`, data.security);
          return res.status(403).json({
            success: false,
            error: "VPN/Proxy detected. Please disable VPN to continue.",
            code: "VPN_DETECTED"
          });
        }
      }
    } catch (err) {
      // API check failed, continue with other checks
      console.log("VPN API check failed:", err);
    }
  }

  next();
}

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  
  next();
}

export function preventInterception(req: Request, res: Response, next: NextFunction) {
  const suspiciousUserAgents = [
    "charles", "fiddler", "mitmproxy", "burp", "zap", 
    "httpdebugger", "proxyman", "httpcanary"
  ];

  const userAgent = (req.headers["user-agent"] || "").toLowerCase();
  
  for (const agent of suspiciousUserAgents) {
    if (userAgent.includes(agent)) {
      return res.status(403).json({
        success: false,
        error: "Request blocked for security reasons",
        code: "SECURITY_BLOCK"
      });
    }
  }

  const acceptEncoding = req.headers["accept-encoding"] || "";
  const connection = req.headers["connection"] || "";
  
  next();
}
