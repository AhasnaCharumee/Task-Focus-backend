"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsLog = void 0;
const mongoose_1 = require("mongoose");
const analyticsLogSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    focusHours: { type: Number, default: 0 },
}, { timestamps: true });
exports.AnalyticsLog = (0, mongoose_1.model)("AnalyticsLog", analyticsLogSchema);
