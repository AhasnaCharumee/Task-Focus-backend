"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validateRequest_1 = require("../middlewares/validateRequest");
const jwt_1 = require("../utils/jwt");
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
let passport;
function getPassport() {
    if (!passport) {
        passport = require("passport");
        require("../config/passport");
    }
    return passport;
}
const router = (0, express_1.Router)();
router.post("/signup", (0, validateRequest_1.validateRequest)(["name", "email", "password"]), authController_1.signup);
router.post("/login", (0, validateRequest_1.validateRequest)(["email", "password"]), authController_1.login);
router.post("/google", (0, validateRequest_1.validateRequest)(["idToken"]), authController_1.googleSignIn);
router.get("/google", (req, res, next) => {
    getPassport().authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
router.get("/google/callback", (req, res, next) => {
    getPassport().authenticate("google", { session: false }, (err, user) => {
        if (err || !user) {
            return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
        }
        const isAdmin = user.email?.toLowerCase() === "focusai.reminder.bot@gmail.com";
        const token = (0, jwt_1.signToken)({
            id: user._id,
            email: user.email,
            role: isAdmin ? "admin" : "user",
        });
        console.log("[GOOGLE LOGIN]", user.email, isAdmin ? "ADMIN" : "USER");
        // ✅ ALWAYS redirect to auth-callback
        return res.redirect(`${frontendUrl}/auth-callback?token=${token}`);
    })(req, res, next);
});
// GitHub OAuth Routes
router.get("/github", (req, res, next) => {
    getPassport().authenticate("github", { scope: ["user:email"] })(req, res, next);
});
router.get("/github/callback", (req, res, next) => {
    getPassport().authenticate("github", { session: false }, (err, user) => {
        if (err || !user) {
            return res.redirect(`${frontendUrl}/login?error=github_auth_failed`);
        }
        const isAdmin = user.email?.toLowerCase() === "focusai.reminder.bot@gmail.com";
        const token = (0, jwt_1.signToken)({
            id: user._id,
            email: user.email,
            role: isAdmin ? "admin" : "user",
        });
        console.log("[GITHUB LOGIN]", user.email, isAdmin ? "ADMIN" : "USER");
        return res.redirect(`${frontendUrl}/auth-callback?token=${token}`);
    })(req, res, next);
});
router.post("/create-admin", (0, validateRequest_1.validateRequest)(["name", "email", "password"]), authController_1.createAdmin);
exports.default = router;
