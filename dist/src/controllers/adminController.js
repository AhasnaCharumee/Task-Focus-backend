"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoginHistory = exports.getUserActivity = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getDashboardStats = exports.makeAdmin = exports.getAllUsers = void 0;
const User_1 = require("../models/User");
const ActivityLog_1 = require("../models/ActivityLog");
const Task_1 = require("../models/Task");
const Feedback_1 = require("../models/Feedback");
const LoginHistory_1 = require("../models/LoginHistory");
// Helper to pick fields to return
const sanitizeUser = (u) => {
    if (!u)
        return null;
    const copy = u.toObject ? u.toObject() : { ...u };
    delete copy.password;
    return copy;
};
// GET ALL USERS  (Admin Only)
const getAllUsers = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(200, Number(req.query.limit) || 50);
        const skip = (page - 1) * limit;
        const q = {};
        if (req.query.search) {
            const s = String(req.query.search);
            q.$or = [{ name: { $regex: s, $options: "i" } }, { email: { $regex: s, $options: "i" } }];
        }
        const [users, total] = await Promise.all([
            User_1.User.find(q).select("-password").skip(skip).limit(limit).sort({ createdAt: -1 }),
            User_1.User.countDocuments(q),
        ]);
        return res.status(200).json({ page, limit, total, users });
    }
    catch (error) {
        console.error("getAllUsers error:", error);
        return res.status(500).json({ message: "Failed to fetch users" });
    }
};
exports.getAllUsers = getAllUsers;
// PROMOTE USER TO ADMIN (Admin Only)
const makeAdmin = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }
        const user = await User_1.User.findByIdAndUpdate(userId, { role: "admin" }, { new: true }).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({
            message: "User promoted to admin successfully",
            user,
        });
    }
    catch (error) {
        console.error("makeAdmin error:", error);
        return res.status(500).json({ message: "Failed to promote user" });
    }
};
exports.makeAdmin = makeAdmin;
// DASHBOARD STATS (Admin Only)
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User_1.User.countDocuments();
        const totalTasks = await Task_1.Task.countDocuments();
        const openFeedback = await Feedback_1.Feedback.countDocuments({ status: 'open' });
        return res.status(200).json({
            totalUsers,
            totalTasks,
            openFeedback,
        });
    }
    catch (error) {
        console.error("getDashboardStats error:", error);
        return res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
};
exports.getDashboardStats = getDashboardStats;
// GET /api/admin/users/:id
const getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User_1.User.findById(id).select("-password");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ user: sanitizeUser(user) });
    }
    catch (err) {
        console.error("getUserById error:", err);
        return res.status(500).json({ message: "Failed to fetch user" });
    }
};
exports.getUserById = getUserById;
// PUT /api/admin/users/:id
const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, email, role, blocked } = req.body;
        const update = {};
        if (name)
            update.name = name;
        if (email)
            update.email = email;
        if (role)
            update.role = role;
        if (blocked !== undefined)
            update.blocked = !!blocked;
        const updated = await User_1.User.findByIdAndUpdate(id, update, { new: true }).select("-password");
        if (!updated)
            return res.status(404).json({ message: "User not found" });
        // audit
        try {
            await ActivityLog_1.ActivityLog.create({ user: req.user?._id, action: 'admin:user:update', meta: { target: id, changes: update } });
        }
        catch (e) {
            console.warn(e);
        }
        return res.status(200).json({ message: "User updated", user: sanitizeUser(updated) });
    }
    catch (err) {
        console.error("updateUser error:", err);
        return res.status(500).json({ message: "Failed to update user" });
    }
};
exports.updateUser = updateUser;
// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await User_1.User.findByIdAndDelete(id).select("-password");
        if (!deleted)
            return res.status(404).json({ message: "User not found" });
        // audit
        try {
            await ActivityLog_1.ActivityLog.create({ user: req.user?._id, action: 'admin:user:delete', meta: { target: id } });
        }
        catch (e) {
            console.warn(e);
        }
        return res.status(200).json({ message: "User deleted", user: sanitizeUser(deleted) });
    }
    catch (err) {
        console.error("deleteUser error:", err);
        return res.status(500).json({ message: "Failed to delete user" });
    }
};
exports.deleteUser = deleteUser;
// GET /api/admin/users/:id/activity
const getUserActivity = async (req, res) => {
    try {
        const id = req.params.id;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(200, Number(req.query.limit) || 50);
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            ActivityLog_1.ActivityLog.find({ user: id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            ActivityLog_1.ActivityLog.countDocuments({ user: id }),
        ]);
        return res.status(200).json({ page, limit, total, items });
    }
    catch (err) {
        console.error("getUserActivity error:", err);
        return res.status(500).json({ message: "Failed to fetch activity" });
    }
};
exports.getUserActivity = getUserActivity;
// GET /api/admin/login-history
const getLoginHistory = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(200, Number(req.query.limit) || 50);
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            LoginHistory_1.LoginHistory.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            LoginHistory_1.LoginHistory.countDocuments(),
        ]);
        return res.status(200).json({ page, limit, total, items });
    }
    catch (err) {
        console.error("getLoginHistory error:", err);
        return res.status(500).json({ message: "Failed to fetch login history" });
    }
};
exports.getLoginHistory = getLoginHistory;
