"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertSetting = exports.getAllSettings = exports.getSettingPublic = void 0;
const Settings_1 = require("../models/Settings");
// Public: GET /api/settings/:key
const getSettingPublic = async (req, res) => {
    try {
        const key = req.params.key;
        const s = await Settings_1.Settings.findOne({ key }).lean();
        if (!s)
            return res.status(404).json({ message: "Setting not found" });
        return res.status(200).json({ key: s.key, value: s.value });
    }
    catch (err) {
        console.error("getSettingPublic error:", err);
        return res.status(500).json({ message: "Failed to fetch setting" });
    }
};
exports.getSettingPublic = getSettingPublic;
// Admin: GET /api/admin/settings
const getAllSettings = async (req, res) => {
    try {
        const all = await Settings_1.Settings.find().lean();
        return res.status(200).json({ settings: all });
    }
    catch (err) {
        console.error("getAllSettings error:", err);
        return res.status(500).json({ message: "Failed to fetch settings" });
    }
};
exports.getAllSettings = getAllSettings;
// Admin: PUT /api/admin/settings/:key
const upsertSetting = async (req, res) => {
    try {
        const key = req.params.key;
        const value = req.body.value;
        if (value === undefined)
            return res.status(400).json({ message: "value is required in body" });
        const updated = await Settings_1.Settings.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true });
        return res.status(200).json({ message: "Setting updated", setting: updated });
    }
    catch (err) {
        console.error("upsertSetting error:", err);
        return res.status(500).json({ message: "Failed to update setting" });
    }
};
exports.upsertSetting = upsertSetting;
