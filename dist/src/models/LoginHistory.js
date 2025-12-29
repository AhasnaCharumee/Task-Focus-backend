"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginHistory = void 0;
const mongoose_1 = require("mongoose");
const loginHistorySchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    ip: String,
    userAgent: String,
    success: { type: Boolean, default: true },
}, { timestamps: true });
exports.LoginHistory = (0, mongoose_1.model)("LoginHistory", loginHistorySchema);
