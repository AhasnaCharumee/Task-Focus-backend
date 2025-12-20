// src/routes/taskRoutes.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  previewReminders,
} from "../controllers/taskController";
import { getCalendarEvents, getTaskIcal } from "../controllers/taskController";

const router = Router();

// Prefix all routes with /api/tasks in main index.ts
// Make sure the frontend calls http://localhost:5000/api/tasks

// Protect all routes with authMiddleware
router.use(authMiddleware);

// Create a task
router.post("/", createTask);

// Get all tasks
router.get("/", getTasks);

// Preview upcoming reminder times for a task template (query param: n=number of occurrences)
router.get("/:id/preview-reminders", previewReminders);
// Calendar endpoints
router.get("/calendar", getCalendarEvents);
router.get("/:id/ical", getTaskIcal);

// Update a task
router.put("/:id", updateTask);

// Delete a task
router.delete("/:id", deleteTask);

export default router;
