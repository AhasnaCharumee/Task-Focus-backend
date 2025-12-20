import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { Task } from "../models/Task";
import { User } from "../models/User";
import { FocusPlan } from "../models/FocusPlan";
import { ActivityLog } from "../models/ActivityLog";
import { AuthRequest } from "../middlewares/auth";

// GET /api/profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Basic user info
    const user = await User.findById(userId).select("-password").lean();

    const totalTasks = await Task.countDocuments({ user: userId });
    // If Task has a `completed` field, this will work; otherwise will be 0
    const completedTasks = await Task.countDocuments({ user: userId, completed: true });

    // Upcoming reminders: tasks with dueDate in next 7 days
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingReminders = await Task.countDocuments({
      user: userId,
      dueDate: { $gte: now, $lte: week },
    });

    // AI usage summary: count focus plans created
    const aiUsageCount = await FocusPlan.countDocuments({ user: userId });

    // Last activity
    const lastActivity = await ActivityLog.findOne({ user: userId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      user,
      stats: {
        totalTasks,
        completedTasks,
        upcomingReminders,
        aiUsageCount,
      },
      lastActivity,
    });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ message: "Failed to fetch profile", error: err });
  }
};

// PUT /api/profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, email, password } = req.body;

    const update: any = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (password) {
      const hashed = await bcrypt.hash(password, 12);
      update.password = hashed;
    }

    // If email is changed, ensure uniqueness
    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: userId } });
      if (exists) return res.status(409).json({ message: "Email already in use" });
    }

    const updated = await User.findByIdAndUpdate(userId, update, { new: true }).select("-password");

    // log activity
    try {
      await ActivityLog.create({ user: userId, action: "profile:update", meta: { changed: Object.keys(update) } });
    } catch (e) {
      console.warn("Failed to write activity log:", e);
    }

    return res.status(200).json({ message: "Profile updated", user: updated });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ message: "Failed to update profile", error: err });
  }
};

// GET /api/profile/activity?page=1&limit=20
export const getActivity = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const items = await ActivityLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ActivityLog.countDocuments({ user: userId });

    return res.status(200).json({ page, limit, total, items });
  } catch (err) {
    console.error("getActivity error:", err);
    return res.status(500).json({ message: "Failed to fetch activity", error: err });
  }
};
