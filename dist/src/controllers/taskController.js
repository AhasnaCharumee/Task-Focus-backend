"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskIcal = exports.getCalendarEvents = exports.previewReminders = exports.deleteTask = exports.updateTask = exports.getTasks = exports.createTask = void 0;
const Task_1 = require("../models/Task");
// simple UTC formatter for iCal timestamps (YYYYMMDDTHHMMSSZ)
function formatDateUTC(d) {
    const yyyy = d.getUTCFullYear().toString().padStart(4, "0");
    const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    const dd = d.getUTCDate().toString().padStart(2, "0");
    const HH = d.getUTCHours().toString().padStart(2, "0");
    const MM = d.getUTCMinutes().toString().padStart(2, "0");
    const SS = d.getUTCSeconds().toString().padStart(2, "0");
    return `${yyyy}${mm}${dd}T${HH}${MM}${SS}Z`;
}
const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, categories, labels, recurrence } = req.body;
        // Debug: show incoming body and auth user
        console.log("createTask body:", req.body);
        const authReq = req;
        console.log("createTask auth user:", authReq.user);
        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }
        if (!authReq.user || !authReq.user._id) {
            return res.status(401).json({ message: "Unauthorized - missing user" });
        }
        // Normalize recurrence if provided
        let recurrenceObj = undefined;
        if (recurrence) {
            recurrenceObj = {
                enabled: !!recurrence.enabled,
                frequency: recurrence.frequency || "daily",
                interval: recurrence.interval ? Number(recurrence.interval) : 1,
                daysOfWeek: Array.isArray(recurrence.daysOfWeek) ? recurrence.daysOfWeek.map(Number) : [],
                startDate: recurrence.startDate ? new Date(recurrence.startDate) : undefined,
                endDate: recurrence.endDate ? new Date(recurrence.endDate) : undefined,
                nextRun: recurrence.nextRun ? new Date(recurrence.nextRun) : recurrence.startDate ? new Date(recurrence.startDate) : undefined,
            };
        }
        const task = new Task_1.Task({
            title,
            description: description || "",
            completed: req.body?.completed ? !!req.body.completed : false,
            priority: priority || "low",
            dueDate: dueDate || null,
            user: authReq.user._id,
            categories: Array.isArray(categories) ? categories : [],
            labels: Array.isArray(labels) ? labels : [],
            recurrence: recurrenceObj,
        });
        await task.save();
        res.status(201).json({ message: "Task created", task });
    }
    catch (err) {
        console.error("createTask error:", err);
        res.status(500).json({ message: "Creating task failed" });
    }
};
exports.createTask = createTask;
const getTasks = async (req, res) => {
    try {
        const authReq = req;
        console.log("getTasks auth user:", authReq.user);
        if (!authReq.user || !authReq.user._id) {
            return res.status(401).json({ message: "Unauthorized - missing user" });
        }
        const userId = authReq.user._id;
        const tasks = await Task_1.Task.find({ user: userId }).sort({ createdAt: -1 }).populate("categories");
        res.json(tasks);
    }
    catch (err) {
        console.error("getTasks error:", err);
        res.status(500).json({ message: "Fetching tasks failed" });
    }
};
exports.getTasks = getTasks;
const updateTask = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user || !authReq.user._id)
            return res.status(401).json({ message: "Unauthorized" });
        const updateData = { ...req.body };
        if (updateData.categories && !Array.isArray(updateData.categories)) {
            updateData.categories = [updateData.categories];
        }
        if (updateData.labels && !Array.isArray(updateData.labels)) {
            // allow comma-separated string as quick client convenience
            if (typeof updateData.labels === "string") {
                updateData.labels = updateData.labels.split(",").map((s) => s.trim()).filter(Boolean);
            }
            else {
                updateData.labels = [updateData.labels];
            }
        }
        if (updateData.recurrence) {
            const r = updateData.recurrence;
            const normalizedRec = {};
            if (r.enabled !== undefined)
                normalizedRec.enabled = !!r.enabled;
            if (r.frequency)
                normalizedRec.frequency = r.frequency;
            if (r.interval !== undefined)
                normalizedRec.interval = Number(r.interval) || 1;
            if (r.daysOfWeek)
                normalizedRec.daysOfWeek = Array.isArray(r.daysOfWeek) ? r.daysOfWeek.map(Number) : [];
            if (r.startDate)
                normalizedRec.startDate = new Date(r.startDate);
            if (r.endDate)
                normalizedRec.endDate = new Date(r.endDate);
            if (r.nextRun)
                normalizedRec.nextRun = new Date(r.nextRun);
            updateData.recurrence = normalizedRec;
        }
        const updated = await Task_1.Task.findOneAndUpdate({ _id: req.params.id, user: authReq.user._id }, updateData, { new: true });
        if (!updated)
            return res.status(404).json({ message: "Task not found or not owned by user" });
        res.json({ message: "Task updated", updated });
    }
    catch (err) {
        res.status(500).json({ message: "Updating task failed", err });
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user || !authReq.user._id)
            return res.status(401).json({ message: "Unauthorized" });
        const deleted = await Task_1.Task.findOneAndDelete({ _id: req.params.id, user: authReq.user._id });
        if (!deleted)
            return res.status(404).json({ message: "Task not found or not owned by user" });
        res.json({ message: "Task deleted" });
    }
    catch (err) {
        res.status(500).json({ message: "Deleting task failed", err });
    }
};
exports.deleteTask = deleteTask;
// Preview upcoming reminder times for a task template
const previewReminders = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user || !authReq.user._id)
            return res.status(401).json({ message: "Unauthorized" });
        const task = await Task_1.Task.findOne({ _id: req.params.id, user: authReq.user._id }).lean();
        if (!task)
            return res.status(404).json({ message: "Task not found" });
        const n = Math.max(1, Number(req.query.n) || 5);
        const reminders = Array.isArray(task.reminders) ? task.reminders.map(Number) : [];
        const occurrences = [];
        // Helper functions similar to recurrenceRunner
        const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
        const addMonths = (date, months) => { const d = new Date(date); const m = d.getMonth(); d.setMonth(m + months); return d; };
        const nextWeeklyOccurrence = (from, daysOfWeek, intervalWeeks) => {
            if (!daysOfWeek || daysOfWeek.length === 0) {
                return addDays(from, 7 * intervalWeeks);
            }
            const sorted = [...new Set(daysOfWeek.map(Number))].sort((a, b) => a - b);
            const fromDow = from.getDay();
            for (const dow of sorted) {
                if (dow > fromDow)
                    return addDays(from, dow - fromDow);
            }
            const first = sorted[0];
            const daysUntil = (7 * intervalWeeks) - (fromDow - first);
            return addDays(from, daysUntil);
        };
        const computeNext = (lastRun, r) => {
            const frequency = r?.frequency;
            const interval = Number(r?.interval || 1);
            const daysOfWeek = r?.daysOfWeek || [];
            if (!frequency)
                return undefined;
            if (frequency === "daily")
                return addDays(lastRun, interval);
            if (frequency === "weekly")
                return nextWeeklyOccurrence(lastRun, daysOfWeek, interval);
            if (frequency === "monthly")
                return addMonths(lastRun, interval);
            return undefined;
        };
        if (task.recurrence && task.recurrence.enabled) {
            // recurring template: start from nextRun or startDate
            let cursor = task.recurrence.nextRun ? new Date(task.recurrence.nextRun) : (task.recurrence.startDate ? new Date(task.recurrence.startDate) : new Date());
            for (let i = 0; i < n; i++) {
                const occ = new Date(cursor);
                const remTimes = reminders.map(m => new Date(occ.getTime() - Number(m) * 60 * 1000).toISOString());
                occurrences.push({ occurrence: occ.toISOString(), reminders: remTimes });
                const next = computeNext(occ, task.recurrence);
                if (!next)
                    break;
                cursor = next;
            }
        }
        else if (task.dueDate) {
            const occ = new Date(task.dueDate);
            const remTimes = reminders.map(m => new Date(occ.getTime() - Number(m) * 60 * 1000).toISOString());
            occurrences.push({ occurrence: occ.toISOString(), reminders: remTimes });
        }
        res.json({ occurrences });
    }
    catch (err) {
        console.error("previewReminders error", err);
        res.status(500).json({ message: "Failed to preview reminders", err });
    }
};
exports.previewReminders = previewReminders;
// Helper: compute occurrences for a recurrence object between start and end (inclusive)
function computeOccurrencesInRange(recurrence, start, end, maxOccurrences = 100) {
    const occurrences = [];
    if (!recurrence || !recurrence.enabled)
        return occurrences;
    const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
    const addMonths = (date, months) => { const d = new Date(date); const m = d.getMonth(); d.setMonth(m + months); return d; };
    const nextWeeklyOccurrence = (from, daysOfWeek, intervalWeeks) => {
        if (!daysOfWeek || daysOfWeek.length === 0)
            return addDays(from, 7 * intervalWeeks);
        const sorted = [...new Set(daysOfWeek.map(Number))].sort((a, b) => a - b);
        const fromDow = from.getDay();
        for (const dow of sorted) {
            if (dow > fromDow)
                return addDays(from, dow - fromDow);
        }
        const first = sorted[0];
        const daysUntil = (7 * intervalWeeks) - (fromDow - first);
        return addDays(from, daysUntil);
    };
    const computeNext = (lastRun, r) => {
        const frequency = r?.frequency;
        const interval = Number(r?.interval || 1);
        const daysOfWeek = r?.daysOfWeek || [];
        if (!frequency)
            return undefined;
        if (frequency === "daily")
            return addDays(lastRun, interval);
        if (frequency === "weekly")
            return nextWeeklyOccurrence(lastRun, daysOfWeek, interval);
        if (frequency === "monthly")
            return addMonths(lastRun, interval);
        return undefined;
    };
    // start from nextRun or startDate
    let cursor = recurrence.nextRun ? new Date(recurrence.nextRun) : (recurrence.startDate ? new Date(recurrence.startDate) : new Date());
    let count = 0;
    while (cursor && count < maxOccurrences) {
        if (recurrence.endDate && new Date(cursor) > new Date(recurrence.endDate))
            break;
        if (cursor >= start && cursor <= end)
            occurrences.push(new Date(cursor));
        const next = computeNext(cursor, recurrence);
        if (!next)
            break;
        cursor = next;
        count += 1;
    }
    return occurrences;
}
// GET /api/tasks/calendar?start=ISO&end=ISO
const getCalendarEvents = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user || !authReq.user._id)
            return res.status(401).json({ message: "Unauthorized" });
        const start = req.query.start ? new Date(String(req.query.start)) : new Date();
        const end = req.query.end ? new Date(String(req.query.end)) : new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 30);
        // fetch user's tasks that either have dueDate in range or recurrence enabled
        const tasks = await Task_1.Task.find({ user: authReq.user._id }).lean();
        const events = [];
        for (const t of tasks) {
            // one-off tasks with dueDate in range
            if (t.dueDate) {
                const d = new Date(t.dueDate);
                if (d >= start && d <= end) {
                    events.push({ id: t._id, title: t.title, start: d.toISOString(), allDay: false, labels: t.labels || [] });
                }
            }
            // recurring templates: compute occurrences within range
            if (t.recurrence && t.recurrence.enabled) {
                const occs = computeOccurrencesInRange(t.recurrence, start, end, 500);
                for (const o of occs) {
                    events.push({ id: t._id, title: t.title, start: o.toISOString(), allDay: false, labels: t.labels || [], isTemplate: true });
                }
            }
        }
        res.json({ events });
    }
    catch (err) {
        console.error("getCalendarEvents error", err);
        res.status(500).json({ message: "Failed to get calendar events", err });
    }
};
exports.getCalendarEvents = getCalendarEvents;
// GET /api/tasks/:id/ical
const getTaskIcal = async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user || !authReq.user._id)
            return res.status(401).json({ message: "Unauthorized" });
        const task = await Task_1.Task.findOne({ _id: req.params.id, user: authReq.user._id }).lean();
        if (!task)
            return res.status(404).json({ message: "Task not found" });
        const lines = [];
        lines.push("BEGIN:VCALENDAR");
        lines.push("VERSION:2.0");
        lines.push("PRODID:-//TaskMgr//EN");
        // If recurring template, include RRULE for simple frequencies (daily/weekly/monthly)
        if (task.recurrence && task.recurrence.enabled) {
            const r = task.recurrence;
            const dtstart = r.nextRun ? new Date(r.nextRun) : (r.startDate ? new Date(r.startDate) : new Date());
            const uid = String(task._id) + "@taskmgr";
            lines.push("BEGIN:VEVENT");
            lines.push(`UID:${uid}`);
            lines.push(`DTSTAMP:${formatDateUTC(new Date())}`);
            lines.push(`DTSTART:${formatDateUTC(new Date(dtstart))}`);
            lines.push(`SUMMARY:${(task.title || "").replace(/\n/g, " ")}`);
            // simple RRULE
            const freq = (r.frequency || "DAILY").toString().toUpperCase();
            const interval = r.interval || 1;
            lines.push(`RRULE:FREQ=${freq};INTERVAL=${interval}`);
            lines.push("END:VEVENT");
        }
        else if (task.dueDate) {
            const dt = new Date(task.dueDate);
            const uid = String(task._id) + "@taskmgr";
            lines.push("BEGIN:VEVENT");
            lines.push(`UID:${uid}`);
            lines.push(`DTSTAMP:${formatDateUTC(new Date())}`);
            lines.push(`DTSTART:${formatDateUTC(dt)}`);
            lines.push(`SUMMARY:${(task.title || "").replace(/\n/g, " ")}`);
            lines.push("END:VEVENT");
        }
        lines.push("END:VCALENDAR");
        const ical = lines.join("\r\n");
        res.setHeader("Content-Type", "text/calendar; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="task-${task._id}.ics"`);
        res.send(ical);
    }
    catch (err) {
        console.error("getTaskIcal error", err);
        res.status(500).json({ message: "Failed to create iCal", err });
    }
};
exports.getTaskIcal = getTaskIcal;
