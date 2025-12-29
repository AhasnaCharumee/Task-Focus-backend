"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamNotifications = exports.markRead = exports.getNotifications = void 0;
const Notification_1 = require("../models/Notification");
const notificationEmitter_1 = __importDefault(require("../utils/notificationEmitter"));
const getNotifications = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user || !authReq.user._id)
            return res.status(401).json({ message: "Unauthorized" });
        const notifs = await Notification_1.Notification.find({ user: authReq.user._id }).sort({ createdAt: -1 }).lean();
        res.json({ notifications: notifs });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch notifications", err });
    }
};
exports.getNotifications = getNotifications;
const markRead = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user || !authReq.user._id)
            return res.status(401).json({ message: "Unauthorized" });
        const id = req.params.id;
        const updated = await Notification_1.Notification.findOneAndUpdate({ _id: id, user: authReq.user._id }, { read: true }, { new: true });
        if (!updated)
            return res.status(404).json({ message: "Notification not found" });
        res.json({ notification: updated });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to mark notification read", err });
    }
};
exports.markRead = markRead;
const streamNotifications = async (req, res) => {
    const authReq = req;
    if (!authReq.user || !authReq.user._id)
        return res.status(401).json({ message: "Unauthorized" });
    // Setup SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    const userId = String(authReq.user._id);
    // send a ping
    res.write(`event: ping\ndata: ${JSON.stringify({ now: new Date().toISOString() })}\n\n`);
    const listener = (notif) => {
        try {
            // only send events for this user
            if (String(notif.user) !== userId)
                return;
            const payload = JSON.stringify(notif);
            res.write(`event: notification\ndata: ${payload}\n\n`);
        }
        catch (e) {
            console.error("SSE write error", e);
        }
    };
    notificationEmitter_1.default.on("notification", listener);
    // cleanup on client disconnect
    req.on("close", () => {
        notificationEmitter_1.default.off("notification", listener);
    });
};
exports.streamNotifications = streamNotifications;
