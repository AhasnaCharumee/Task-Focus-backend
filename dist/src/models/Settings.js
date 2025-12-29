"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const mongoose_1 = require("mongoose");
const settingsSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    description: { type: String },
}, { timestamps: true });
exports.Settings = (0, mongoose_1.model)("Settings", settingsSchema);
