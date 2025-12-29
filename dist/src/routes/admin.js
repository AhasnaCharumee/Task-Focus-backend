"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const adminController_2 = require("../controllers/adminController");
const adminLoginController_1 = require("../controllers/adminLoginController");
const settingsController_1 = require("../controllers/settingsController");
const announcementController_1 = require("../controllers/announcementController");
const auth_1 = require("../middlewares/auth");
const adminOnly_1 = require("../middlewares/adminOnly");
const router = (0, express_1.Router)();
/** ADMIN LOGIN */
router.post("/login", adminLoginController_1.adminLogin);
/** ADMIN ONLY ACTIONS */
router.get("/users", auth_1.authMiddleware, adminOnly_1.adminOnly, adminController_1.getAllUsers);
router.get("/users/:id", auth_1.authMiddleware, adminOnly_1.adminOnly, adminController_2.getUserById);
router.put("/users/:id", auth_1.authMiddleware, adminOnly_1.adminOnly, adminController_2.updateUser);
router.delete("/users/:id", auth_1.authMiddleware, adminOnly_1.adminOnly, adminController_2.deleteUser);
router.get("/users/:id/activity", auth_1.authMiddleware, adminOnly_1.adminOnly, adminController_2.getUserActivity);
router.post("/promote", auth_1.authMiddleware, adminOnly_1.adminOnly, adminController_1.makeAdmin);
// OPTIONAL: Add a dashboard stats route
const adminController_3 = require("../controllers/adminController");
router.get("/dashboard", auth_1.authMiddleware, adminOnly_1.adminOnly, adminController_3.getDashboardStats);
// Settings admin
router.get("/settings", auth_1.authMiddleware, adminOnly_1.adminOnly, settingsController_1.getAllSettings);
router.put("/settings/:key", auth_1.authMiddleware, adminOnly_1.adminOnly, settingsController_1.upsertSetting);
// Announcements
router.post("/announcements", auth_1.authMiddleware, adminOnly_1.adminOnly, announcementController_1.createAnnouncement);
router.get("/announcements", auth_1.authMiddleware, adminOnly_1.adminOnly, announcementController_1.listAnnouncements);
router.put("/announcements/:id", auth_1.authMiddleware, adminOnly_1.adminOnly, announcementController_1.updateAnnouncement);
router.delete("/announcements/:id", auth_1.authMiddleware, adminOnly_1.adminOnly, announcementController_1.deleteAnnouncement);
router.post("/announcements/:id/send", auth_1.authMiddleware, adminOnly_1.adminOnly, announcementController_1.sendAnnouncementNow);
// Security: login history
const adminController_4 = require("../controllers/adminController");
router.get("/login-history", auth_1.authMiddleware, adminOnly_1.adminOnly, adminController_4.getLoginHistory);
exports.default = router;
