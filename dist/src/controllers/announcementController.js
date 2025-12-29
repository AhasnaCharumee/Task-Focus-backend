"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAnnouncementNow = exports.deleteAnnouncement = exports.updateAnnouncement = exports.listAnnouncements = exports.createAnnouncement = void 0;
const Announcement_1 = require("../models/Announcement");
const User_1 = require("../models/User");
const Notification_1 = require("../models/Notification");
const notificationEmitter_1 = __importDefault(require("../utils/notificationEmitter"));
const ActivityLog_1 = require("../models/ActivityLog");
// Admin: create announcement
const createAnnouncement = async (req, res) => {
    try {
        const { title, body, scheduledAt, sendImmediately } = req.body;
        if (!title || !body)
            return res.status(400).json({ message: "title and body are required" });
        const a = await Announcement_1.Announcement.create({ title, body, scheduledAt, sendImmediately: !!sendImmediately });
        // If immediate, dispatch now
        if (sendImmediately) {
            await dispatchAnnouncement(a);
        }
        return res.status(201).json({ message: "Announcement created", announcement: a });
    }
    catch (err) {
        console.error("createAnnouncement error:", err);
        return res.status(500).json({ message: "Failed to create announcement" });
    }
};
exports.createAnnouncement = createAnnouncement;
// Admin: list announcements
const listAnnouncements = async (req, res) => {
    try {
        const items = await Announcement_1.Announcement.find().sort({ createdAt: -1 }).lean();
        return res.status(200).json({ items });
    }
    catch (err) {
        console.error("listAnnouncements error:", err);
        return res.status(500).json({ message: "Failed to list announcements" });
    }
};
exports.listAnnouncements = listAnnouncements;
// Admin: update announcement
const updateAnnouncement = async (req, res) => {
    try {
        const id = req.params.id;
        const update = req.body;
        const updated = await Announcement_1.Announcement.findByIdAndUpdate(id, update, { new: true }).lean();
        return res.status(200).json({ message: "Updated", announcement: updated });
    }
    catch (err) {
        console.error("updateAnnouncement error:", err);
        return res.status(500).json({ message: "Failed to update announcement" });
    }
};
exports.updateAnnouncement = updateAnnouncement;
// Admin: delete announcement
const deleteAnnouncement = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await Announcement_1.Announcement.findByIdAndDelete(id).lean();
        return res.status(200).json({ message: "Deleted", announcement: deleted });
    }
    catch (err) {
        console.error("deleteAnnouncement error:", err);
        return res.status(500).json({ message: "Failed to delete announcement" });
    }
};
exports.deleteAnnouncement = deleteAnnouncement;
// Admin: send announcement (create notifications for all users)
const sendAnnouncementNow = async (req, res) => {
    try {
        const id = req.params.id;
        const a = await Announcement_1.Announcement.findById(id);
        if (!a)
            return res.status(404).json({ message: "Announcement not found" });
        await dispatchAnnouncement(a);
        try {
            await ActivityLog_1.ActivityLog.create({ user: req.user?._id, action: 'admin:announcement:send', meta: { announcementId: id } });
        }
        catch (e) {
            console.warn(e);
        }
        return res.status(200).json({ message: "Announcement dispatched" });
    }
    catch (err) {
        console.error("sendAnnouncementNow error:", err);
        return res.status(500).json({ message: "Failed to send announcement" });
    }
};
exports.sendAnnouncementNow = sendAnnouncementNow;
async function dispatchAnnouncement(a) {
    // fetch all users and create a Notification per user; emit via emitter
    const users = await User_1.User.find().select("_id").lean();
    const promises = [];
    for (const u of users) {
        const notif = new Notification_1.Notification({ user: u._id, message: `${a.title}: ${a.body}`, type: "system", viaInApp: true, sentAt: new Date() });
        promises.push(notif.save().then((saved) => {
            // emit only the saved notification
            notificationEmitter_1.default.emit("notification", saved);
            return saved;
        }));
    }
    await Promise.all(promises);
}
