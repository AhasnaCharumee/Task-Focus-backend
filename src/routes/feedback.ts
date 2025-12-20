import { Router } from "express";
import { submitFeedback } from "../controllers/feedbackController";
import { authMiddleware } from "../middlewares/auth";
import { adminOnly } from "../middlewares/adminOnly";
import { listFeedback, updateFeedbackStatus } from "../controllers/feedbackController";

const router = Router();

// Submit (authenticated users only)
router.post("/", authMiddleware, submitFeedback);

// Admin routes
router.get("/", authMiddleware, adminOnly, listFeedback);
router.put("/:id", authMiddleware, adminOnly, updateFeedbackStatus);

export default router;
