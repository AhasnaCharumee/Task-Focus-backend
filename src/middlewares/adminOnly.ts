import { RequestHandler } from "express";
import { AuthRequest } from "./auth";

export const adminOnly: RequestHandler = (req, res, next) => {
  const authReq = req as AuthRequest;

  if (!authReq.user || authReq.user.role !== "admin") {
    console.warn("Unauthorized admin access attempt:", authReq.user?.email);
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};
