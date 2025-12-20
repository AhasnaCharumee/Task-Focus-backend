import { Router } from "express";
import {
	generateFocusPlan,
	generateMotivation,
	generateGoalBreakdown,
	analyzeSentiment,
	contextSuggestions,
} from "../controllers/aiController";

const router = Router();

/**
 * @route POST /api/ai/focus-plan
 * @desc  Generate a focus plan from a list of tasks
 * @access Public (adjust to protected if needed)
 */
router.post("/focus-plan", generateFocusPlan);

/**
 * @route POST /api/ai/motivation
 * @desc  Generate a short motivational message
 * @access Public
 */
router.post("/motivation", generateMotivation);

/**
 * New AI endpoints
 */
router.post("/goal-breakdown", generateGoalBreakdown);
router.post("/sentiment", analyzeSentiment);
router.post("/context-suggest", contextSuggestions);

export default router;
