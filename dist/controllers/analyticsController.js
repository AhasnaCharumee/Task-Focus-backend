"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalytics = void 0;
const Task_1 = require("../models/Task");
// 🔹 Get Analytics
const getAnalytics = async (req, res) => {
    try {
        const userId = req.user.userId;
        const totalTasks = await Task_1.Task.countDocuments({ user: userId });
        const completedTasks = await Task_1.Task.countDocuments({ user: userId, completed: true });
        const pendingTasks = totalTasks - completedTasks;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        res.status(200).json({
            totalTasks,
            completedTasks,
            pendingTasks,
            completionRate: completionRate.toFixed(1),
        });
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching analytics", error: err });
    }
};
exports.getAnalytics = getAnalytics;
