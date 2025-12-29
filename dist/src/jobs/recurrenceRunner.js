"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRecurrenceWorker = startRecurrenceWorker;
const Task_1 = require("../models/Task");
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}
function addMonths(date, months) {
    const d = new Date(date);
    const m = d.getMonth();
    d.setMonth(m + months);
    return d;
}
function nextWeeklyOccurrence(from, daysOfWeek, intervalWeeks) {
    if (!daysOfWeek || daysOfWeek.length === 0) {
        // default: same weekday every N weeks
        const d = addDays(from, 7 * intervalWeeks);
        return d;
    }
    // sort daysOfWeek ascending
    const sorted = [...new Set(daysOfWeek.map(Number))].sort((a, b) => a - b);
    // find next day in this week
    const fromDow = from.getDay();
    for (const dow of sorted) {
        if (dow > fromDow) {
            const delta = dow - fromDow;
            return addDays(from, delta);
        }
    }
    // none left this week -> jump to first in next intervalWeeks weeks
    const first = sorted[0];
    const daysUntil = (7 * intervalWeeks) - (fromDow - first);
    return addDays(from, daysUntil);
}
function computeNextRun(lastRun, recurrence) {
    const { frequency, interval = 1, daysOfWeek } = recurrence || {};
    if (!frequency)
        return undefined;
    if (frequency === "daily") {
        return addDays(lastRun, interval);
    }
    if (frequency === "weekly") {
        return nextWeeklyOccurrence(lastRun, daysOfWeek || [], interval);
    }
    if (frequency === "monthly") {
        return addMonths(lastRun, interval);
    }
    return undefined;
}
function startRecurrenceWorker(pollIntervalMs = 60 * 1000) {
    console.log("Starting recurrence worker, polling every", pollIntervalMs, "ms");
    const work = async () => {
        try {
            const now = new Date();
            // find tasks whose recurrence is enabled and nextRun <= now
            const dueTemplates = await Task_1.Task.find({
                "recurrence.enabled": true,
                "recurrence.nextRun": { $lte: now },
            }).exec();
            for (const tmpl of dueTemplates) {
                try {
                    const r = tmpl.recurrence;
                    if (!r)
                        continue;
                    const nextRun = r.nextRun ? new Date(r.nextRun) : (r.startDate ? new Date(r.startDate) : now);
                    // avoid duplicates: ensure lastRun !== nextRun
                    const lastRun = r.lastRun ? new Date(r.lastRun) : undefined;
                    if (lastRun && lastRun.getTime() === nextRun.getTime()) {
                        // already processed
                        // compute next and update template
                        const computed = computeNextRun(nextRun, r);
                        tmpl.recurrence = tmpl.recurrence || {};
                        tmpl.recurrence.lastRun = nextRun;
                        tmpl.recurrence.nextRun = computed;
                        if (tmpl.recurrence.endDate && computed && new Date(computed) > new Date(tmpl.recurrence.endDate)) {
                            tmpl.recurrence.enabled = false;
                        }
                        await tmpl.save();
                        continue;
                    }
                    // create a new task instance from template
                    const instance = new Task_1.Task({
                        title: tmpl.title,
                        description: tmpl.description,
                        priority: tmpl.priority,
                        dueDate: nextRun,
                        user: tmpl.user,
                        categories: tmpl.categories || [],
                        labels: tmpl.labels || [],
                        // instances are one-off tasks, do not copy recurrence
                    });
                    await instance.save();
                    // update template's lastRun and compute nextRun
                    tmpl.recurrence = tmpl.recurrence || {};
                    tmpl.recurrence.lastRun = nextRun;
                    const computed = computeNextRun(nextRun, r);
                    tmpl.recurrence.nextRun = computed;
                    if (tmpl.recurrence.endDate && computed && new Date(computed) > new Date(tmpl.recurrence.endDate)) {
                        tmpl.recurrence.enabled = false;
                    }
                    await tmpl.save();
                }
                catch (innerErr) {
                    console.error("Failed processing recurring template", tmpl._id, innerErr);
                }
            }
        }
        catch (err) {
            console.error("Recurrence worker error:", err);
        }
    };
    // run immediately then on interval
    work();
    const id = setInterval(work, pollIntervalMs);
    return () => clearInterval(id);
}
exports.default = startRecurrenceWorker;
