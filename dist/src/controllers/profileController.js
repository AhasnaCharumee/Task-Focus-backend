"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivity = exports.updateProfile = exports.getProfile = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
const FocusPlan_1 = require("../models/FocusPlan");
const ActivityLog_1 = require("../models/ActivityLog");
// GET /api/profile
const getProfile = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?._id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        // Basic user info from DB (for profile fields) but trust role from JWT middleware
        const dbUser = await User_1.User.findById(userId).select("-password").lean();
        const responseUser = {
            _id: authReq.user?._id || dbUser?._id,
            id: authReq.user?.id || dbUser?._id,
            email: authReq.user?.email || dbUser?.email,
            name: dbUser?.name || authReq.user?.email?.split('@')[0] || 'User',
            role: authReq.user?.role || dbUser?.role || 'user',
        };
        const totalTasks = await Task_1.Task.countDocuments({ user: userId });
        // If Task has a `completed` field, this will work; otherwise will be 0
        const completedTasks = await Task_1.Task.countDocuments({ user: userId, completed: true });
        // Upcoming reminders: tasks with dueDate in next 7 days
        const now = new Date();
        const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingReminders = await Task_1.Task.countDocuments({
            user: userId,
            dueDate: { $gte: now, $lte: week },
        });
        // AI usage summary: count focus plans created
        const aiUsageCount = await FocusPlan_1.FocusPlan.countDocuments({ user: userId });
        // Last activity
        const lastActivity = await ActivityLog_1.ActivityLog.findOne({ user: userId }).sort({ createdAt: -1 }).lean();
        return res.status(200).json({
            user: responseUser,
            stats: {
                totalTasks,
                completedTasks,
                upcomingReminders,
                aiUsageCount,
            },
            lastActivity,
        });
    }
    catch (err) {
        console.error("getProfile error:", err);
        return res.status(500).json({ message: "Failed to fetch profile", error: err });
    }
};
exports.getProfile = getProfile;
// PUT /api/profile
const updateProfile = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?._id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const { name, email, password } = req.body;
        const update = {};
        if (name)
            update.name = name;
        if (email)
            update.email = email;
        if (password) {
            const hashed = await bcryptjs_1.default.hash(password, 12);
            update.password = hashed;
        }
        // If email is changed, ensure uniqueness
        if (email) {
            const exists = await User_1.User.findOne({ email, _id: { $ne: userId } });
            if (exists)
                return res.status(409).json({ message: "Email already in use" });
        }
        const updated = await User_1.User.findByIdAndUpdate(userId, update, { new: true }).select("-password");
        // log activity
        try {
            await ActivityLog_1.ActivityLog.create({ user: userId, action: "profile:update", meta: { changed: Object.keys(update) } });
        }
        catch (e) {
            console.warn("Failed to write activity log:", e);
        }
        return res.status(200).json({ message: "Profile updated", user: updated });
    }
    catch (err) {
        console.error("updateProfile error:", err);
        return res.status(500).json({ message: "Failed to update profile", error: err });
    }
};
exports.updateProfile = updateProfile;
// GET /api/profile/activity?page=1&limit=20
const getActivity = async (req, res) => {
    try {
        const authReq = req;
        const userId = authReq.user?._id;
        if (!userId)
            return res.status(401).json({ message: "Unauthorized" });
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const items = await ActivityLog_1.ActivityLog.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await ActivityLog_1.ActivityLog.countDocuments({ user: userId });
        return res.status(200).json({ page, limit, total, items });
    }
    catch (err) {
        console.error("getActivity error:", err);
        return res.status(500).json({ message: "Failed to fetch activity", error: err });
    }
};
exports.getActivity = getActivity;
