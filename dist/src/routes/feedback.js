"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feedbackController_1 = require("../controllers/feedbackController");
const auth_1 = require("../middlewares/auth");
const adminOnly_1 = require("../middlewares/adminOnly");
const feedbackController_2 = require("../controllers/feedbackController");
const router = (0, express_1.Router)();
// Submit (authenticated users only)
router.post("/", auth_1.authMiddleware, feedbackController_1.submitFeedback);
// Admin routes
router.get("/", auth_1.authMiddleware, adminOnly_1.adminOnly, feedbackController_2.listFeedback);
router.put("/:id", auth_1.authMiddleware, adminOnly_1.adminOnly, feedbackController_2.updateFeedbackStatus);
exports.default = router;
