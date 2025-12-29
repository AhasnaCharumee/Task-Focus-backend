"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feedback = void 0;
const mongoose_1 = require("mongoose");
const feedbackSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    type: { type: String, enum: ["bug", "feature", "other"], default: "other" },
    status: { type: String, enum: ["open", "in_progress", "closed"], default: "open" },
    meta: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
exports.Feedback = (0, mongoose_1.model)("Feedback", feedbackSchema);
