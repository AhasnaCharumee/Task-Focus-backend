import { RequestHandler } from "express";

export const adminOnly: RequestHandler = (req, res, next) => {
  const user = (req as any).user;

  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};
