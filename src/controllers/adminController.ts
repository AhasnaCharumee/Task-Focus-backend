import { Request, Response } from "express";
import { User } from "../models/User";
import { ActivityLog } from "../models/ActivityLog";
import { Task } from "../models/Task";
import { Feedback } from "../models/Feedback";
import { LoginHistory } from "../models/LoginHistory";

// Helper to pick fields to return
const sanitizeUser = (u: any) => {
  if (!u) return null;
  const copy = u.toObject ? u.toObject() : { ...u };
  delete copy.password;
  return copy;
};

// GET ALL USERS  (Admin Only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const q: any = {};
    if (req.query.search) {
      const s = String(req.query.search);
      q.$or = [{ name: { $regex: s, $options: "i" } }, { email: { $regex: s, $options: "i" } }];
    }

    const [users, total] = await Promise.all([
      User.find(q).select("-password").skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(q),
    ]);

    return res.status(200).json({ page, limit, total, users });
  } catch (error) {
    console.error("getAllUsers error:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

// PROMOTE USER TO ADMIN (Admin Only)
export const makeAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "admin" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User promoted to admin successfully",
      user,
    });
  } catch (error) {
    console.error("makeAdmin error:", error);
    return res.status(500).json({ message: "Failed to promote user" });
  }
};

// DASHBOARD STATS (Admin Only)
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTasks = await Task.countDocuments();
    const openFeedback = await Feedback.countDocuments({ status: 'open' });
    return res.status(200).json({
      totalUsers,
      totalTasks,
      openFeedback,
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

// GET /api/admin/users/:id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("getUserById error:", err);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

// PUT /api/admin/users/:id
export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { name, email, role, blocked } = req.body;
    const update: any = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (role) update.role = role;
    if (blocked !== undefined) update.blocked = !!blocked;

    const updated = await User.findByIdAndUpdate(id, update, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ message: "User not found" });

    // audit
    try { await ActivityLog.create({ user: (req as any).user?._id, action: 'admin:user:update', meta: { target: id, changes: update } }); } catch (e) { console.warn(e); }

    return res.status(200).json({ message: "User updated", user: sanitizeUser(updated) });
  } catch (err) {
    console.error("updateUser error:", err);
    return res.status(500).json({ message: "Failed to update user" });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const deleted = await User.findByIdAndDelete(id).select("-password");
    if (!deleted) return res.status(404).json({ message: "User not found" });

    // audit
    try { await ActivityLog.create({ user: (req as any).user?._id, action: 'admin:user:delete', meta: { target: id } }); } catch (e) { console.warn(e); }

    return res.status(200).json({ message: "User deleted", user: sanitizeUser(deleted) });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

// GET /api/admin/users/:id/activity
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ActivityLog.find({ user: id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments({ user: id }),
    ]);

    return res.status(200).json({ page, limit, total, items });
  } catch (err) {
    console.error("getUserActivity error:", err);
    return res.status(500).json({ message: "Failed to fetch activity" });
  }
};

// GET /api/admin/login-history
export const getLoginHistory = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      LoginHistory.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LoginHistory.countDocuments(),
    ]);
    return res.status(200).json({ page, limit, total, items });
  } catch (err) {
    console.error("getLoginHistory error:", err);
    return res.status(500).json({ message: "Failed to fetch login history" });
  }
};
