"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_1 = require("../controllers/aiController");
const router = (0, express_1.Router)();
/**
 * @route POST /api/ai/focus-plan
 * @desc  Generate a focus plan from a list of tasks
 * @access Public (adjust to protected if needed)
 */
router.post("/focus-plan", aiController_1.generateFocusPlan);
/**
 * @route POST /api/ai/motivation
 * @desc  Generate a short motivational message
 * @access Public
 */
router.post("/motivation", aiController_1.generateMotivation);
/**
 * New AI endpoints
 */
router.post("/goal-breakdown", aiController_1.generateGoalBreakdown);
router.post("/sentiment", aiController_1.analyzeSentiment);
router.post("/context-suggest", aiController_1.contextSuggestions);
exports.default = router;
