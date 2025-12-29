"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FocusPlan = void 0;
const mongoose_1 = require("mongoose");
const focusPlanSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    tasks: [{ type: String, required: true }],
    aiSummary: { type: String, required: true },
}, { timestamps: true });
exports.FocusPlan = (0, mongoose_1.model)("FocusPlan", focusPlanSchema);
