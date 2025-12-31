// middleware/authMiddleware.ts
import { Request, RequestHandler } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: {
    _id?: string;
    id?: string;
    email?: string;
    role?: "admin" | "user";
  };
}

// Use Express-compatible signature and normalise decoded token into user._id
export const authMiddleware: RequestHandler = (req, res, next) => {
  const authReq = req as AuthRequest;

  try {
    const authHeader = authReq.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = verifyToken(token);

    // normalize id
    const userId = decoded?.id || decoded?._id || decoded?.userId;

    // 🔥 ADMIN EMAIL CHECK (SOURCE OF TRUTH)
    const isAdmin = String(decoded?.email || "").toLowerCase() ===
      "focusai.reminder.bot@gmail.com";

    authReq.user = {
      _id: userId,
      id: userId,
      email: decoded?.email,
      role: isAdmin ? "admin" : "user",
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(403).json({ message: "Invalid token" });
  }
};
