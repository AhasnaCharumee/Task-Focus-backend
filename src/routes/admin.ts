import { Router } from "express";
import { getAllUsers, makeAdmin } from "../controllers/adminController";
import { getUserById, updateUser, deleteUser, getUserActivity } from "../controllers/adminController";
import { adminLogin } from "../controllers/adminLoginController";
import { getAllSettings, upsertSetting } from "../controllers/settingsController";
import { createAnnouncement, listAnnouncements, updateAnnouncement, deleteAnnouncement, sendAnnouncementNow } from "../controllers/announcementController";
import { authMiddleware } from "../middlewares/auth";
import { adminOnly } from "../middlewares/adminOnly";

const router = Router();

/** ADMIN LOGIN */
router.post("/login", adminLogin);

/** ADMIN ONLY ACTIONS */
router.get("/users", authMiddleware, adminOnly, getAllUsers);
router.get("/users/:id", authMiddleware, adminOnly, getUserById);
router.put("/users/:id", authMiddleware, adminOnly, updateUser);
router.delete("/users/:id", authMiddleware, adminOnly, deleteUser);
router.get("/users/:id/activity", authMiddleware, adminOnly, getUserActivity);
router.post("/promote", authMiddleware, adminOnly, makeAdmin);

// OPTIONAL: Add a dashboard stats route
import { getDashboardStats } from "../controllers/adminController";
router.get("/dashboard", authMiddleware, adminOnly, getDashboardStats);

// Settings admin
router.get("/settings", authMiddleware, adminOnly, getAllSettings);
router.put("/settings/:key", authMiddleware, adminOnly, upsertSetting);

// Announcements
router.post("/announcements", authMiddleware, adminOnly, createAnnouncement);
router.get("/announcements", authMiddleware, adminOnly, listAnnouncements);
router.put("/announcements/:id", authMiddleware, adminOnly, updateAnnouncement);
router.delete("/announcements/:id", authMiddleware, adminOnly, deleteAnnouncement);
router.post("/announcements/:id/send", authMiddleware, adminOnly, sendAnnouncementNow);

// Security: login history
import { getLoginHistory } from "../controllers/adminController";
router.get("/login-history", authMiddleware, adminOnly, getLoginHistory);

export default router;
