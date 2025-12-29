"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    // optional Google subject id for users created via Google Sign-In
    googleId: { type: String },
    // optional Facebook id for users created via Facebook Sign-In
    facebookId: { type: String },
    // optional GitHub id for users created via GitHub Sign-In
    githubId: { type: String },
    // 🔥 Add role field
    role: { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true });
exports.User = (0, mongoose_1.model)("User", userSchema);
