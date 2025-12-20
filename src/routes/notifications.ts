import { Router } from "express";
import { getNotifications, markRead, streamNotifications } from "../controllers/notificationsController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);
router.get("/", getNotifications);
router.get("/stream", streamNotifications);
router.put("/:id/read", markRead);

export default router;
