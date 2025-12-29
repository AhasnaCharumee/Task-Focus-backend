"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeedbackStatus = exports.listFeedback = exports.submitFeedback = void 0;
const Feedback_1 = require("../models/Feedback");
const ActivityLog_1 = require("../models/ActivityLog");
// Public: submit feedback
const submitFeedback = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user || !authReq.user._id)
            return res.status(401).json({ message: "Unauthorized" });
        const { message, type } = req.body;
        if (!message)
            return res.status(400).json({ message: "message is required" });
        const fb = await Feedback_1.Feedback.create({ user: authReq.user._id, message, type: type || "other" });
        // optional activity log for user's submission
        try {
            await ActivityLog_1.ActivityLog.create({ user: authReq.user._id, action: 'feedback:submit', meta: { feedbackId: fb._id } });
        }
        catch (e) {
            console.warn(e);
        }
        return res.status(201).json({ message: "Feedback submitted", feedback: fb });
    }
    catch (err) {
        console.error("submitFeedback error:", err);
        return res.status(500).json({ message: "Failed to submit feedback" });
    }
};
exports.submitFeedback = submitFeedback;
// Admin: list feedback
const listFeedback = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(200, Number(req.query.limit) || 50);
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            Feedback_1.Feedback.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Feedback_1.Feedback.countDocuments(),
        ]);
        return res.status(200).json({ page, limit, total, items });
    }
    catch (err) {
        console.error("listFeedback error:", err);
        return res.status(500).json({ message: "Failed to list feedback" });
    }
};
exports.listFeedback = listFeedback;
// Admin: update feedback status
const updateFeedbackStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        if (!status)
            return res.status(400).json({ message: "status is required" });
        const updated = await Feedback_1.Feedback.findByIdAndUpdate(id, { status }, { new: true }).lean();
        // audit
        try {
            await ActivityLog_1.ActivityLog.create({ user: req.user?._id, action: 'admin:feedback:update', meta: { id, status } });
        }
        catch (e) {
            console.warn(e);
        }
        return res.status(200).json({ message: "Feedback updated", feedback: updated });
    }
    catch (err) {
        console.error("updateFeedbackStatus error:", err);
        return res.status(500).json({ message: "Failed to update feedback" });
    }
};
exports.updateFeedbackStatus = updateFeedbackStatus;
