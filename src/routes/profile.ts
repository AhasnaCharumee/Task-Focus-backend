import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { getProfile, updateProfile, getActivity } from "../controllers/profileController";

const router = Router();

router.get("/", authMiddleware, getProfile);
router.put("/", authMiddleware, updateProfile);
router.get("/activity", authMiddleware, getActivity);

export default router;
