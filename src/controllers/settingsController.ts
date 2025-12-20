import { Request, Response } from "express";
import { Settings } from "../models/Settings";

// Public: GET /api/settings/:key
export const getSettingPublic = async (req: Request, res: Response) => {
  try {
    const key = req.params.key;
    const s = await Settings.findOne({ key }).lean();
    if (!s) return res.status(404).json({ message: "Setting not found" });
    return res.status(200).json({ key: s.key, value: s.value });
  } catch (err) {
    console.error("getSettingPublic error:", err);
    return res.status(500).json({ message: "Failed to fetch setting" });
  }
};

// Admin: GET /api/admin/settings
export const getAllSettings = async (req: Request, res: Response) => {
  try {
    const all = await Settings.find().lean();
    return res.status(200).json({ settings: all });
  } catch (err) {
    console.error("getAllSettings error:", err);
    return res.status(500).json({ message: "Failed to fetch settings" });
  }
};

// Admin: PUT /api/admin/settings/:key
export const upsertSetting = async (req: Request, res: Response) => {
  try {
    const key = req.params.key;
    const value = req.body.value;
    if (value === undefined) return res.status(400).json({ message: "value is required in body" });

    const updated = await Settings.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true });
    return res.status(200).json({ message: "Setting updated", setting: updated });
  } catch (err) {
    console.error("upsertSetting error:", err);
    return res.status(500).json({ message: "Failed to update setting" });
  }
};
