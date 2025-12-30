import { Router } from "express";
import { signup, login, googleSignIn, createAdmin } from "../controllers/authController";
import { validateRequest } from "../middlewares/validateRequest";
import { signToken } from "../utils/jwt";

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
let passport: any;

// Lazy load passport to avoid circular imports
function getPassport() {
  if (!passport) {
    passport = require("passport");
    require("../config/passport"); // Initialize strategies
  }
  return passport;
}

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post(
  "/signup",
  validateRequest(["name", "email", "password"]),
  signup
);

/**
 * @route   POST /api/auth/login
 * @desc    Login existing user
 * @access  Public
 */
router.post(
  "/login",
  validateRequest(["email", "password"]),
  login
);



/**
 * @route   POST /api/auth/google
 * @desc    Google Sign-in with ID Token (from client)
 * @access  Public
 */


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
  getPassport().authenticate(
    "google",
    { session: false },
    (err: any, user: any) => {
      if (err) {
        console.error("Google auth error:", err);
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      if (!user) {
        return res.redirect(`${frontendUrl}/login?error=user_not_found`);
      }

      // ✅ ADMIN CHECK BY EMAIL ONLY
      const isAdmin = user.email === "focusai.reminder.bot@gmail.com";

      const token = signToken({
        id: user._id,
        email: user.email,
        role: isAdmin ? "admin" : "user",
      });

      // 🔴 ADMIN → ADMIN DASHBOARD
      if (isAdmin) {
        return res.redirect(
          `${frontendUrl}/admin/dashboard?token=${token}`
        );
      }

      // 🟢 NORMAL USER → USER DASHBOARD
      return res.redirect(
        `${frontendUrl}/user/dashboard?token=${token}`
      );
    }
  )(req, res, next);
});

/**
 * @route POST /api/auth/create-admin
 * @desc  Create an admin user (requires ADMIN_CREATE_SECRET header or body.secret)
 * @access Public (guarded by secret)
 */
router.post("/create-admin", validateRequest(["name", "email", "password"]), createAdmin);

/**
 * @route   GET /api/auth/facebook
 * @desc    Facebook Sign-In (redirect to Facebook login)
 * @access  Public
 */
router.get("/facebook", (req, res, next) => {
  const host = req.get("host");
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
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
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const callbackURL = `${proto}://${host}/api/auth/facebook/callback`;
  getPassport().authenticate("facebook", { session: false, callbackURL }, (err: any, user: any) => {
    if (err) {
      console.error("Facebook auth error:", err);
      return res.status(500).json({ message: "Authentication failed" });
    }
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    const token = signToken({
      id: user._id,
      _id: user._id,
      email: user.email,
      role: user.role,
    });
    // Admin email restriction: Only focusai.reminder.bot@gmail.com can access admin dashboard
    if (user.role === "admin") {
      if (user.email === "focusai.reminder.bot@gmail.com") {
        return res.redirect(`${frontendUrl}/admin/dashboard?token=${token}&email=${user.email}&name=${user.name}`);
      } else {
        return res.redirect(`${frontendUrl}/login?error=unauthorized_admin`);
      }
    }
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
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const callbackURL = `${proto}://${host}/api/auth/github/callback`;
  getPassport().authenticate("github", { scope: ["user:email"], callbackURL })(req, res, next);
});

export default router;
