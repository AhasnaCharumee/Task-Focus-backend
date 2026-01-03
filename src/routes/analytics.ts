import express from "express";
import { authMiddleware } from "../middlewares/auth";
import { getAnalytics } from "../controllers/analyticsController";

const router = express.Router();

// User analytics endpoint
router.get("/", authMiddleware, getAnalytics);

export default router;
