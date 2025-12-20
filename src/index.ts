import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import taskRoutes from "./routes/tasks";
import authRoutes from "./routes/auth";
import aiRoutes from "./routes/ai";
import adminRoutes from "./routes/admin";
import categoriesRoutes from "./routes/categories";
import startRecurrenceWorker from "./jobs/recurrenceRunner";
import startReminderWorker from "./jobs/reminderRunner";
import { startTaskReminderJob } from "./jobs/taskReminder";
import notificationsRoutes from "./routes/notifications";
import exportRoutes from "./routes/export";
import profileRoutes from "./routes/profile";
import settingsRoutes from "./routes/settings";
import feedbackRoutes from "./routes/feedback";
import testReminderRoutes from "./routes/testReminder";
import testAdminRoutes from "./routes/testAdmin";
import { connectDB } from "./config/db";
import passport from "./config/passport";

const app = express();
app.use(express.json());

// Enable CORS for your frontend (React)
// Allow CORS from local dev origins. Use a function so different localhost ports are accepted.
app.use(
  cors({
    origin: (incomingOrigin, callback) => {
      // Allow requests with no origin (mobile clients, curl)
      if (!incomingOrigin) return callback(null, true);
      try {
        const url = new URL(incomingOrigin);
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          return callback(null, true);
        }
      } catch (e) {
        // fall-through to reject
      }
      const allowed = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
      if (allowed.includes(incomingOrigin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Note: explicit `app.options("*", ...)` caused path-to-regexp errors on some setups,
// the global `app.use(cors(...))` above handles preflight responses already.
  // Allow popups to communicate back via postMessage (needed for some OAuth popup flows)
  app.use((req, res, next) => {
    // 'same-origin-allow-popups' permits window.postMessage from popup flows while keeping COOP protections
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
  });

// Initialize Passport.js
app.use(passport.initialize());

// Mount all routes BEFORE DB connection
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/test", testReminderRoutes);
app.use("/api/test", testAdminRoutes);

// Basic error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", err);
  // In dev, return stack to help debugging
  const payload: any = { message: err?.message || "Internal Server Error" };
  if (process.env.NODE_ENV !== "production") payload.stack = err?.stack;
  res.status(err?.status || 500).json(payload);
});

// Start server after DB connection
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("DB Connected. Starting workers...");
    // Only listen locally, not in Vercel
    if (!process.env.VERCEL) {
      app.listen(PORT, () => console.log(`Server running on ${PORT}`));
    }
    // start recurrence worker after DB connection
    try {
      startRecurrenceWorker(60 * 1000);
    } catch (err) {
      console.error("Failed to start recurrence worker:", err);
    }
    try {
      startReminderWorker(60 * 1000);
    } catch (err) {
      console.error("Failed to start reminder worker:", err);
    }
    // Start task reminder email job (runs daily at 9:00 AM)
    try {
      startTaskReminderJob();
    } catch (err) {
      console.error("Failed to start task reminder job:", err);
    }
  })
  .catch((err) => {
    console.error("DB connection error (app still running):", err);
  });

export default app;
