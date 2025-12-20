import { Request, Response } from "express";
import { Announcement } from "../models/Announcement";
import { User } from "../models/User";
import { Notification } from "../models/Notification";
import notificationEmitter from "../utils/notificationEmitter";
import { ActivityLog } from "../models/ActivityLog";

// Admin: create announcement
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, body, scheduledAt, sendImmediately } = req.body;
    if (!title || !body) return res.status(400).json({ message: "title and body are required" });
    const a = await Announcement.create({ title, body, scheduledAt, sendImmediately: !!sendImmediately });
    // If immediate, dispatch now
    if (sendImmediately) {
      await dispatchAnnouncement(a);
    }
    return res.status(201).json({ message: "Announcement created", announcement: a });
  } catch (err) {
    console.error("createAnnouncement error:", err);
    return res.status(500).json({ message: "Failed to create announcement" });
  }
};

// Admin: list announcements
export const listAnnouncements = async (req: Request, res: Response) => {
  try {
    const items = await Announcement.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ items });
  } catch (err) {
    console.error("listAnnouncements error:", err);
    return res.status(500).json({ message: "Failed to list announcements" });
  }
};

// Admin: update announcement
export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const update = req.body;
    const updated = await Announcement.findByIdAndUpdate(id, update, { new: true }).lean();
    return res.status(200).json({ message: "Updated", announcement: updated });
  } catch (err) {
    console.error("updateAnnouncement error:", err);
    return res.status(500).json({ message: "Failed to update announcement" });
  }
};

// Admin: delete announcement
export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const deleted = await Announcement.findByIdAndDelete(id).lean();
    return res.status(200).json({ message: "Deleted", announcement: deleted });
  } catch (err) {
    console.error("deleteAnnouncement error:", err);
    return res.status(500).json({ message: "Failed to delete announcement" });
  }
};

// Admin: send announcement (create notifications for all users)
export const sendAnnouncementNow = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const a = await Announcement.findById(id);
    if (!a) return res.status(404).json({ message: "Announcement not found" });
    await dispatchAnnouncement(a);
    try { await ActivityLog.create({ user: (req as any).user?._id, action: 'admin:announcement:send', meta: { announcementId: id } }); } catch (e) { console.warn(e); }
    return res.status(200).json({ message: "Announcement dispatched" });
  } catch (err) {
    console.error("sendAnnouncementNow error:", err);
    return res.status(500).json({ message: "Failed to send announcement" });
  }
};

async function dispatchAnnouncement(a: any) {
  // fetch all users and create a Notification per user; emit via emitter
  const users = await User.find().select("_id").lean();
  const promises: Promise<any>[] = [];
  for (const u of users) {
    const notif = new Notification({ user: u._id, message: `${a.title}: ${a.body}`, type: "system", viaInApp: true, sentAt: new Date() });
    promises.push(notif.save().then((saved) => {
      // emit only the saved notification
      notificationEmitter.emit("notification", saved);
      return saved;
    }));
  }
  await Promise.all(promises);
}
