"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User_1.User.findOne({ email });
        if (!admin)
            return res.status(401).json({ message: "Invalid email or password" });
        const passOk = await bcryptjs_1.default.compare(password, admin.password);
        if (!passOk)
            return res.status(401).json({ message: "Invalid email or password" });
        if (admin.role !== "admin") {
            return res.status(403).json({ message: "Not an admin account" });
        }
        // Only allow focusai.reminder.bot@gmail.com as admin
        if (admin.email !== "focusai.reminder.bot@gmail.com") {
            return res.status(403).json({ message: "Unauthorized admin account" });
        }
        const token = (0, jwt_1.signToken)({
            id: admin._id,
            email: admin.email,
            role: admin.role,
        });
        return res.status(200).json({
            message: "Admin Login Successful",
            token,
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    }
    catch (err) {
        console.error("adminLogin error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.adminLogin = adminLogin;
