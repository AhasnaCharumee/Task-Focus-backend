import { Router } from "express";
import { signup, login, googleSignIn, createAdmin } from "../controllers/authController";
import { validateRequest } from "../middlewares/validateRequest";
import { signToken } from "../utils/jwt";
import { User } from "../models/User";

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
let passport: any;

function getPassport() {
  if (!passport) {
    passport = require("passport");
    require("../config/passport");
  }
  return passport;
}

const router = Router();

router.post("/signup", validateRequest(["name", "email", "password"]), signup);
router.post("/login", validateRequest(["email", "password"]), login);
router.post("/google", validateRequest(["idToken"]), googleSignIn);

router.get("/google", (req, res, next) => {
  getPassport().authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  getPassport().authenticate(
    "google",
    { session: false },
    (err: any, user: any) => {
      if (err || !user) {
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      const isAdmin =
        user.email?.toLowerCase() === "focusai.reminder.bot@gmail.com";

      const token = signToken({
        id: user._id,
        email: user.email,
        role: isAdmin ? "admin" : "user",
      });

      console.log("[GOOGLE LOGIN]", user.email, isAdmin ? "ADMIN" : "USER");

      // ✅ ALWAYS redirect to auth-callback
      return res.redirect(
        `${frontendUrl}/auth-callback?token=${token}`
      );
    }
  )(req, res, next);
});

// Firebase Authentication route
router.post("/firebase", validateRequest(["idToken"]), async (req, res, next) => {
  try {
    const { idToken, name, email } = req.body;
    const admin = require("firebase-admin");
    
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseId = decodedToken.uid;

    let user = await User.findOne({ firebaseId });

    if (!user) {
      // Check if user already exists with this email
      user = await User.findOne({ email });
      
      if (user) {
        // Link Firebase ID to existing user
        user.firebaseId = firebaseId;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          name: name || email.split("@")[0],
          email,
          password: "oauth-user-no-password",
          firebaseId,
          role: "user",
        });
      }
    }

    const isAdmin = user.email?.toLowerCase() === "focusai.reminder.bot@gmail.com";
    const token = signToken({
      id: user._id,
      email: user.email,
      role: isAdmin ? "admin" : "user",
    });

    console.log("[FIREBASE LOGIN]", user.email, isAdmin ? "ADMIN" : "USER");

    res.json({
      message: "Firebase login successful",
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (err: any) {
    console.error("Firebase auth error:", err);
    return res.status(401).json({ message: "Firebase authentication failed", error: err.message });
  }
});

// GitHub OAuth routes
router.get("/github", (req, res, next) => {
  getPassport().authenticate("github", { scope: ["user:email"] })(req, res, next);
});

router.get("/github/callback", (req, res, next) => {
  getPassport().authenticate(
    "github",
    { session: false },
    (err: any, user: any) => {
      if (err || !user) {
        const errorMsg = err?.message || "github_auth_failed";
        return res.redirect(
          `${frontendUrl}/auth-callback?error=${encodeURIComponent(errorMsg)}`
        );
      }

      const token = signToken({
        id: user._id,
        email: user.email,
        role: user.role || "user",
      });

      console.log("[GITHUB LOGIN]", user.email, user.role || "USER");

      // ✅ Redirect to auth-callback with token, email, and name
      return res.redirect(
        `${frontendUrl}/auth-callback?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}`
      );
    }
  )(req, res, next);
});

router.post(
  "/create-admin",
  validateRequest(["name", "email", "password"]),
  createAdmin
);

export default router;
