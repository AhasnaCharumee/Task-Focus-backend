// middleware/authMiddleware.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: { _id?: string; id?: string; email?: string; role?: string };
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

    // normalize common id shapes: decoded.id or decoded._id or decoded.userId
    const userId = decoded?.id || decoded?._id || decoded?.userId;

    authReq.user = {
      _id: userId,
      id: userId,
      email: decoded?.email,
      role: decoded?.role,
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
