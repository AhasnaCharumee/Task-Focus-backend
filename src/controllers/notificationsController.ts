import { RequestHandler } from "express";
import { Notification } from "../models/Notification";
import { AuthRequest } from "../middlewares/auth";
import notificationEmitter from "../utils/notificationEmitter";

export const getNotifications: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || !authReq.user._id) return res.status(401).json({ message: "Unauthorized" });
    const notifs = await Notification.find({ user: authReq.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ notifications: notifs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications", err });
  }
};

export const markRead: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user || !authReq.user._id) return res.status(401).json({ message: "Unauthorized" });
    const id = req.params.id;
    const updated = await Notification.findOneAndUpdate({ _id: id, user: authReq.user._id }, { read: true }, { new: true });
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    res.json({ notification: updated });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark notification read", err });
  }
};

export const streamNotifications: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  if (!authReq.user || !authReq.user._id) return res.status(401).json({ message: "Unauthorized" });

  // Setup SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const userId = String(authReq.user._id);

  // send a ping
  res.write(`event: ping\ndata: ${JSON.stringify({ now: new Date().toISOString() })}\n\n`);

  const listener = (notif: any) => {
    try {
      // only send events for this user
      if (String(notif.user) !== userId) return;
      const payload = JSON.stringify(notif);
      res.write(`event: notification\ndata: ${payload}\n\n`);
    } catch (e) {
      console.error("SSE write error", e);
    }
  };

  notificationEmitter.on("notification", listener);

  // cleanup on client disconnect
  req.on("close", () => {
    notificationEmitter.off("notification", listener);
  });
};
