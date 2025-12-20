"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuth = exports.login = exports.createAdmin = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
// SIGNUP (user only)
const signup = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const existing = await User_1.User.findOne({ email });
        if (existing)
            return res.status(409).json({ message: "User already exists" });
        const hashed = await bcryptjs_1.default.hash(password, 12);
        const user = await User_1.User.create({ name, email, password: hashed, role: "user" });
        const token = (0, jwt_1.signToken)({ id: user._id, email: user.email, role: user.role });
        res.status(201).json({
            message: "User created",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            token,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.signup = signup;
// ADMIN CREATE (admin-only action)
const createAdmin = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const exists = await User_1.User.findOne({ email });
        if (exists)
            return res.status(409).json({ message: "Admin already exists" });
        const hashed = await bcryptjs_1.default.hash(password, 12);
        const admin = await User_1.User.create({ name, email, password: hashed, role: "admin" });
        res.status(201).json({ message: "Admin created", admin });
    }
    catch (err) {
        next(err);
    }
};
exports.createAdmin = createAdmin;
// LOGIN
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email });
        if (!user)
            return res.status(401).json({ message: "Invalid credentials" });
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ message: "Invalid credentials" });
        const token = (0, jwt_1.signToken)({
            id: user._id,
            email: user.email,
            role: user.role,
        });
        res.status(200).json({
            message: "Logged in",
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
// GOOGLE AUTH
const googleAuth = async (req, res, next) => {
    try {
        const profile = req.body.profile;
        let user = await User_1.User.findOne({ email: profile.email });
        if (!user) {
            user = await User_1.User.create({
                name: profile.name || "Google User",
                email: profile.email,
                password: "",
                role: "user",
            });
        }
        const token = (0, jwt_1.signToken)({
            id: user._id,
            email: user.email,
            role: user.role,
        });
        res.status(200).json({
            message: "Google login successful",
            token,
            user,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.googleAuth = googleAuth;
