"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validateRequest_1 = require("../middlewares/validateRequest");
const jwt_1 = require("../utils/jwt");
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
let passport;
// Lazy load passport to avoid circular imports
function getPassport() {
    if (!passport) {
        passport = require("passport");
        require("../config/passport"); // Initialize strategies
    }
    return passport;
}
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post("/signup", (0, validateRequest_1.validateRequest)(["name", "email", "password"]), authController_1.signup);
/**
 * @route   POST /api/auth/login
 * @desc    Login existing user
 * @access  Public
 */
router.post("/login", (0, validateRequest_1.validateRequest)(["email", "password"]), authController_1.login);
/**
 * @route   POST /api/auth/google
 * @desc    Google Sign-in with ID Token (from client)
 * @access  Public
 */
router.post("/google", (0, validateRequest_1.validateRequest)(["idToken"]), authController_1.googleSignIn);
/**
 * @route   GET /api/auth/google
 * @desc    Google Sign-In (redirect to Google login)
 * @access  Public
 */
router.get("/google", (req, res, next) => {
    getPassport().authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
/**
 * @route   GET /api/auth/google/callback
 * @desc    Google callback - returns JWT token for frontend
 * @access  Public
 */
router.get("/google/callback", (req, res, next) => {
    getPassport().authenticate("google", { session: false }, (err, user) => {
        if (err) {
            console.error("Google auth error:", err);
            return res.status(500).json({ message: "Authentication failed", error: err.message });
        }
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        // Admin email restriction: Only focusai.reminder.bot@gmail.com can access admin dashboard
        if (user.role === "admin" && user.email !== "focusai.reminder.bot@gmail.com") {
            return res.redirect(`${frontendUrl}/login?error=unauthorized_admin`);
        }
        const token = (0, jwt_1.signToken)({
            id: user._id,
            _id: user._id,
            email: user.email,
            role: user.role,
        });
        // If debug mode requested, return JSON directly
        if (req.query.debug === "1") {
            return res.json({
                token,
                email: user.email,
                name: user.name,
                role: user.role,
            });
        }
        // Redirect to frontend with token
        res.redirect(`${frontendUrl}/auth-callback?token=${token}&email=${user.email}&name=${user.name}`);
    })(req, res, next);
});
/**
 * @route POST /api/auth/create-admin
 * @desc  Create an admin user (requires ADMIN_CREATE_SECRET header or body.secret)
 * @access Public (guarded by secret)
 */
router.post("/create-admin", (0, validateRequest_1.validateRequest)(["name", "email", "password"]), authController_1.createAdmin);
/**
 * @route   GET /api/auth/facebook
 * @desc    Facebook Sign-In (redirect to Facebook login)
 * @access  Public
 */
router.get("/facebook", (req, res, next) => {
    const host = req.get("host");
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const callbackURL = `${proto}://${host}/api/auth/facebook/callback`;
    getPassport().authenticate("facebook", { scope: ["public_profile"], callbackURL })(req, res, next);
});
/**
 * @route   GET /api/auth/facebook/callback
 * @desc    Facebook callback - returns JWT token for frontend
 * @access  Public
 */
router.get("/facebook/callback", (req, res, next) => {
    const host = req.get("host");
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const callbackURL = `${proto}://${host}/api/auth/facebook/callback`;
    getPassport().authenticate("facebook", { session: false, callbackURL }, (err, user) => {
        if (err) {
            console.error("Facebook auth error:", err);
            return res.status(500).json({ message: "Authentication failed" });
        }
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        // Admin email restriction: Only focusai.reminder.bot@gmail.com can access admin dashboard
        if (user.role === "admin" && user.email !== "focusai.reminder.bot@gmail.com") {
            return res.redirect(`${frontendUrl}/login?error=unauthorized_admin`);
        }
        const token = (0, jwt_1.signToken)({
            id: user._id,
            _id: user._id,
            email: user.email,
            role: user.role,
        });
        // If debug mode requested, return JSON directly
        if (req.query.debug === "1") {
            return res.json({
                token,
                email: user.email,
                name: user.name,
                role: user.role,
            });
        }
        // Redirect to frontend with token
        res.redirect(`${frontendUrl}/auth-callback?token=${token}&email=${user.email}&name=${user.name}`);
    })(req, res, next);
});
/**
 * @route   GET /api/auth/github
 * @desc    GitHub Sign-In (redirect to GitHub login)
 * @access  Public
 */
router.get("/github", (req, res, next) => {
    const host = req.get("host");
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const callbackURL = `${proto}://${host}/api/auth/github/callback`;
    getPassport().authenticate("github", { scope: ["user:email"], callbackURL })(req, res, next);
});
/**
 * @route   GET /api/auth/github/callback
 * @desc    GitHub callback - returns JWT token for frontend
 * @access  Public
 */
router.get("/github/callback", (req, res, next) => {
    const host = req.get("host");
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const callbackURL = `${proto}://${host}/api/auth/github/callback`;
    getPassport().authenticate("github", { session: false, callbackURL }, (err, user, info) => {
        if (err) {
            console.error("GitHub auth error:", err);
            return res.status(500).json({ message: "Authentication failed", error: err.message });
        }
        if (!user) {
            console.error("GitHub auth: no user found", info);
            return res.status(401).json({ message: "User not found", info });
        }
        // Admin email restriction: Only focusai.reminder.bot@gmail.com can access admin dashboard
        if (user.role === "admin" && user.email !== "focusai.reminder.bot@gmail.com") {
            return res.redirect(`${frontendUrl}/login?error=unauthorized_admin`);
        }
        const token = (0, jwt_1.signToken)({
            id: user._id,
            _id: user._id,
            email: user.email,
            role: user.role,
        });
        // If debug mode requested, return JSON directly
        if (req.query.debug === "1") {
            return res.json({
                token,
                email: user.email,
                name: user.name,
                role: user.role,
            });
        }
        // Redirect to frontend with token
        res.redirect(`${frontendUrl}/auth-callback?token=${token}&email=${user.email}&name=${user.name}`);
    })(req, res, next);
});
exports.default = router;
