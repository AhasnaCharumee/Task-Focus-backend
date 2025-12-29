"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/taskRoutes.ts
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const taskController_1 = require("../controllers/taskController");
const taskController_2 = require("../controllers/taskController");
const router = (0, express_1.Router)();
// Prefix all routes with /api/tasks in main index.ts
// Make sure the frontend calls http://localhost:5000/api/tasks
// Protect all routes with authMiddleware
router.use(auth_1.authMiddleware);
// Create a task
router.post("/", taskController_1.createTask);
// Get all tasks
router.get("/", taskController_1.getTasks);
// Preview upcoming reminder times for a task template (query param: n=number of occurrences)
router.get("/:id/preview-reminders", taskController_1.previewReminders);
// Calendar endpoints
router.get("/calendar", taskController_2.getCalendarEvents);
router.get("/:id/ical", taskController_2.getTaskIcal);
// Update a task
router.put("/:id", taskController_1.updateTask);
// Delete a task
router.delete("/:id", taskController_1.deleteTask);
exports.default = router;
