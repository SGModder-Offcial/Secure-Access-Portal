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

const vpnAsns = [
  "AS9009", "AS20473", "AS14061", "AS16276", "AS24940", "AS51167",
  "AS60729", "AS136787", "AS209", "AS46606", "AS8100", "AS9370"
];

const vpnRanges = [
  "104.238", "198.7.58", "192.241", "162.243", "45.33",
  "178.62", "139.59", "188.166", "206.189", "68.183"
];

export function detectVPN(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "";
  const forwardedFor = req.headers["x-forwarded-for"] as string;
  const realIp = forwardedFor?.split(",")[0]?.trim() || ip;

  const proxyHeaders = [
    "x-forwarded-for",
    "x-real-ip", 
    "via",
    "x-proxy-id",
    "forwarded",
    "proxy-connection",
    "x-proxy-connection"
  ];

  const suspiciousHeaders = proxyHeaders.filter(h => req.headers[h]);
  
  for (const range of vpnRanges) {
    if (realIp.startsWith(range)) {
      return res.status(403).json({
        success: false,
        error: "VPN/Proxy detected. Please disable VPN to continue.",
        code: "VPN_DETECTED"
      });
    }
  }

  if (suspiciousHeaders.length > 2) {
    console.log(`Suspicious proxy headers detected from ${realIp}:`, suspiciousHeaders);
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
