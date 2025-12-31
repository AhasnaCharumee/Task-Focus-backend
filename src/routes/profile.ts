import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { getProfile, updateProfile, getActivity } from "../controllers/profileController";

const router = Router();

router.get("/", authMiddleware, getProfile);
// Validate token and return current user info
router.get("/validate", authMiddleware, (req, res) => {
	const authReq = req as any;
	return res.json({ user: authReq.user });
});
router.put("/", authMiddleware, updateProfile);
router.get("/activity", authMiddleware, getActivity);

export default router;
