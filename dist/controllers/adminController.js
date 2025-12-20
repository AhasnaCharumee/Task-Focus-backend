"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeAdmin = exports.getAllUsers = void 0;
const User_1 = require("../models/User");
// Get all users
const getAllUsers = async (req, res) => {
    const users = await User_1.User.find().select("-password");
    res.json({ users });
};
exports.getAllUsers = getAllUsers;
// Promote a user to admin
const makeAdmin = async (req, res) => {
    const { userId } = req.body;
    if (!userId)
        return res.status(400).json({ message: "userId required" });
    const user = await User_1.User.findByIdAndUpdate(userId, { role: "admin" }, { new: true }).select("-password");
    if (!user)
        return res.status(404).json({ message: "User not found" });
    res.json({ message: "User promoted to admin", user });
};
exports.makeAdmin = makeAdmin;
