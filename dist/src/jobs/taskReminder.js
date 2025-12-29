"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTaskReminderJob = startTaskReminderJob;
const node_cron_1 = __importDefault(require("node-cron"));
const Task_1 = require("../models/Task");
const sendEmail_1 = require("../utils/sendEmail");
/**
 * Task Reminder Job
 * Runs every day at 9:00 AM to check for overdue incomplete tasks
 * and sends email reminders to users who haven't completed them
 */
function startTaskReminderJob() {
    // Run daily at 9:07 AM
    // Format: minute hour day month dayOfWeek
    // '7 9 * * *' = 9:07 AM every day
    node_cron_1.default.schedule('47 9 * * *', async () => {
        console.log('Running task reminder job...');
        try {
            const now = new Date();
            // Find tasks needing reminders:
            // A) Overdue tasks (dueDate < now)
            // B) Incomplete tasks with no due date, older than N days since creation
            //    N defaults to 1 day; configurable via env REMINDER_NO_DUE_DAYS
            const noDueDays = Number(process.env.REMINDER_NO_DUE_DAYS || 1);
            const createdBefore = new Date(now.getTime() - noDueDays * 24 * 60 * 60 * 1000);
            const overdueTasks = await Task_1.Task.find({
                completed: false,
                reminderSent: { $ne: true },
                $or: [
                    { dueDate: { $lt: now } },
                    { $and: [{ dueDate: null }, { createdAt: { $lt: createdBefore } }] },
                ],
            }).populate('user');
            console.log(`Found ${overdueTasks.length} overdue tasks to send reminders for`);
            for (const task of overdueTasks) {
                try {
                    const user = task.user;
                    if (!user || !user.email) {
                        console.log(`Skipping task ${task._id}: no user email found`);
                        continue;
                    }
                    // Calculate days metric (overdue or since creation when no dueDate)
                    const taskDoc = task;
                    const daysMetric = task.dueDate
                        ? Math.floor((now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24))
                        : Math.floor((now.getTime() - new Date(taskDoc.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                    // Send email reminder
                    await (0, sendEmail_1.sendEmail)({
                        to: user.email,
                        subject: `⏰ Task Reminder: "${task.title}" needs your attention`,
                        text: `Hello ${user.name || 'there'},

${task.dueDate ? `Your task "${task.title}" was due on ${task.dueDate.toLocaleDateString()} and is now ${daysMetric} day(s) overdue.` : `Your task "${task.title}" has no due date set and has been pending for ${daysMetric} day(s).`}

Please complete this task as soon as possible.

Task Details:
- Title: ${task.title}
- Priority: ${task.priority}
${task.dueDate ? `- Due Date: ${task.dueDate.toLocaleDateString()}` : ''}
${task.description ? `- Description: ${task.description}` : ''}

Best regards,
FocusAI Task Management Team`,
                        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #dc2626; margin-top: 0;">⏰ Task Overdue Reminder</h2>
    
    <p>Hello <strong>${user.name || 'there'}</strong>,</p>
    
    <p>${task.dueDate
                            ? `Your task <strong>"${task.title}"</strong> was due on <strong>${task.dueDate.toLocaleDateString()}</strong> and is now <span style="color: #dc2626; font-weight: bold;">${daysMetric} day(s) overdue</span>.`
                            : `Your task <strong>"${task.title}"</strong> has <strong>no due date</strong> and has been pending for <span style="color: #dc2626; font-weight: bold;">${daysMetric} day(s)</span>.`}</p>
    
    <p>Please complete this task as soon as possible.</p>
    
    <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <h3 style="margin-top: 0; color: #991b1b;">Task Details</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Title:</strong> ${task.title}</li>
        <li><strong>Priority:</strong> <span style="text-transform: uppercase; color: ${task.priority === 'high' ? '#dc2626' : task.priority === 'medium' ? '#f59e0b' : '#10b981'};">${task.priority}</span></li>
        ${task.dueDate ? `<li><strong>Due Date:</strong> ${task.dueDate.toLocaleDateString()}</li>` : ''}
        ${task.description ? `<li><strong>Description:</strong> ${task.description}</li>` : ''}
      </ul>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Best regards,<br>
      <strong>FocusAI Task Management Team</strong>
    </p>
  </div>
</div>
`,
                    });
                    // Mark reminder as sent
                    task.reminderSent = true;
                    await task.save();
                    console.log(`Reminder sent for task "${task.title}" to ${user.email}`);
                }
                catch (error) {
                    console.error(`Error sending reminder for task ${task._id}:`, error);
                }
            }
            console.log('Task reminder job completed');
        }
        catch (error) {
            console.error('Error in task reminder job:', error);
        }
    });
    console.log('Task reminder job scheduled (runs daily at 9:00 AM)');
}
