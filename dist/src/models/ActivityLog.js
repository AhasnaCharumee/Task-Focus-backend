"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLog = void 0;
const mongoose_1 = require("mongoose");
const activityLogSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    meta: { type: mongoose_1.Schema.Types.Mixed },
    ip: { type: String },
}, { timestamps: true });
exports.ActivityLog = (0, mongoose_1.model)("ActivityLog", activityLogSchema);
