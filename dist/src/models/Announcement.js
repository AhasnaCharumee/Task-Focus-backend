"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Announcement = void 0;
const mongoose_1 = require("mongoose");
const announcementSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    scheduledAt: Date,
    sendImmediately: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
}, { timestamps: true });
exports.Announcement = (0, mongoose_1.model)("Announcement", announcementSchema);
