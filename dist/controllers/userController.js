"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const User_1 = require("../models/User");
// 🔹 Get Profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User_1.User.findById(userId).select("-password");
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching profile", error: err });
    }
};
exports.getProfile = getProfile;
// 🔹 Update Profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const updates = req.body;
        const updatedUser = await User_1.User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");
        res.status(200).json({ message: "Profile updated", user: updatedUser });
    }
    catch (err) {
        res.status(500).json({ message: "Error updating profile", error: err });
    }
};
exports.updateProfile = updateProfile;
