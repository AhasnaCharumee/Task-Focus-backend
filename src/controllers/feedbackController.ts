import { Request, Response } from "express";
import { Feedback } from "../models/Feedback";
import { ActivityLog } from "../models/ActivityLog";
import { AuthRequest } from "../middlewares/auth";

// Public: submit feedback
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || !authReq.user._id) return res.status(401).json({ message: "Unauthorized" });

    const { message, type } = req.body;
    if (!message) return res.status(400).json({ message: "message is required" });

    const fb = await Feedback.create({ user: authReq.user._id, message, type: type || "other" });

    // optional activity log for user's submission
    try { await ActivityLog.create({ user: authReq.user._id, action: 'feedback:submit', meta: { feedbackId: fb._id } }); } catch (e) { console.warn(e); }

    return res.status(201).json({ message: "Feedback submitted", feedback: fb });
  } catch (err) {
    console.error("submitFeedback error:", err);
    return res.status(500).json({ message: "Failed to submit feedback" });
  }
};

// Admin: list feedback
export const listFeedback = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Feedback.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Feedback.countDocuments(),
    ]);
    return res.status(200).json({ page, limit, total, items });
  } catch (err) {
    console.error("listFeedback error:", err);
    return res.status(500).json({ message: "Failed to list feedback" });
  }
};

// Admin: update feedback status
export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "status is required" });
    const updated = await Feedback.findByIdAndUpdate(id, { status }, { new: true }).lean();
    // audit
    try { await ActivityLog.create({ user: (req as any).user?._id, action: 'admin:feedback:update', meta: { id, status } }); } catch (e) { console.warn(e); }
    return res.status(200).json({ message: "Feedback updated", feedback: updated });
  } catch (err) {
    console.error("updateFeedbackStatus error:", err);
    return res.status(500).json({ message: "Failed to update feedback" });
  }
};
