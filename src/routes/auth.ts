import { Router } from "express";
import { signup, login, googleSignIn, createAdmin } from "../controllers/authController";
import { validateRequest } from "../middlewares/validateRequest";
import { signToken } from "../utils/jwt";

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

// GitHub OAuth Routes
router.get("/github", (req, res, next) => {
  getPassport().authenticate("github", { scope: ["user:email"] })(req, res, next);
});

router.get("/github/callback", (req, res, next) => {
  getPassport().authenticate(
    "github",
    { session: false },
    (err: any, user: any) => {
      if (err || !user) {
        return res.redirect(`${frontendUrl}/login?error=github_auth_failed`);
      }

      const isAdmin =
        user.email?.toLowerCase() === "focusai.reminder.bot@gmail.com";

      const token = signToken({
        id: user._id,
        email: user.email,
        role: isAdmin ? "admin" : "user",
      });

      console.log("[GITHUB LOGIN]", user.email, isAdmin ? "ADMIN" : "USER");

      return res.redirect(
        `${frontendUrl}/auth-callback?token=${token}`
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
