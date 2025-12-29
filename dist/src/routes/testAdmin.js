"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
/**
 * TEST ENDPOINT: Make a user admin by email (creates the user if missing)
 * POST /api/test/make-admin
 * Body: { email: "focusai.reminder.bot@gmail.com", name?: "Bot" }
 * This is for testing purposes only - remove in production
 */
router.post('/make-admin', async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        let user = await User_1.User.findOne({ email });
        // If user missing, create one with random password
        if (!user) {
            const randomPassword = Math.random().toString(36).slice(-12);
            const hashed = await bcryptjs_1.default.hash(randomPassword, 10);
            user = new User_1.User({
                email,
                name: name || email.split('@')[0],
                password: hashed,
                role: 'admin',
            });
        }
        else {
            // Update existing user role to admin
            user.role = 'admin';
        }
        await user.save();
        return res.status(200).json({
            success: true,
            message: `User ${email} is now an admin`,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Error making user admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to make user admin',
            error: error.message,
        });
    }
});
exports.default = router;
