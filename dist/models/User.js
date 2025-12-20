"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    // 🔥 Add role field
    role: { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true });
exports.User = (0, mongoose_1.model)("User", userSchema);
