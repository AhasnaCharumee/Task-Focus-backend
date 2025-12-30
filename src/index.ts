import express from "express";
import cors from "cors";
import taskRoutes from "./routes/tasks";
import authRoutes from "./routes/auth";
import aiRoutes from "./routes/ai";
import adminRoutes from "./routes/admin";
import categoriesRoutes from "./routes/categories";
import notificationsRoutes from "./routes/notifications";
import exportRoutes from "./routes/export";
import profileRoutes from "./routes/profile";
import settingsRoutes from "./routes/settings";
import feedbackRoutes from "./routes/feedback";
import testReminderRoutes from "./routes/testReminder";
import testAdminRoutes from "./routes/testAdmin";
import connectDB from "./config/db";
import passport from "./config/passport";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: (incomingOrigin, callback) => {
      if (!incomingOrigin) return callback(null, true);
      try {
        const url = new URL(incomingOrigin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          return callback(null, true);
        }
      } catch (e) {}
      const allowed = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://task-focus-frontend-1xnv.vercel.app"
      ];
      if (allowed.includes(incomingOrigin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});
app.get("/", (req, res) => {
  res.status(200).send("Task Focus API is running");
});
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});


const PORT = 3000;

const start = async () => {
  await connectDB();
  app.use(passport.initialize());
  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/categories", categoriesRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/export", exportRoutes);
  app.use("/api/profile", profileRoutes);
  app.get("/api/user/profile", (req, res, next) => {
    const { authMiddleware } = require("./middlewares/auth");
    const { getProfile } = require("./controllers/profileController");
    return authMiddleware(req, res, (err: any) => {
      if (err) return next(err);
      getProfile(req, res, next);
    });
  });
  app.use("/api/settings", settingsRoutes);
  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/test", testReminderRoutes);
  app.use("/api/test", testAdminRoutes);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

start();

export default app;
