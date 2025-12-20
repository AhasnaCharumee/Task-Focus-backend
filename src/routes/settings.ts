import { Router } from "express";
import { getSettingPublic } from "../controllers/settingsController";

const router = Router();

// Public read-only access to some settings
router.get("/:key", getSettingPublic);

export default router;
