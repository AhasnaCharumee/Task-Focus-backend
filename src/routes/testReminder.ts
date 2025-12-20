import { Router } from 'express';
import { Task } from '../models/Task';
import { sendEmail } from '../utils/sendEmail';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

/**
 * TEST ENDPOINT: Manually trigger reminder email for overdue tasks
 * POST /api/test/send-reminders
 * This is for testing purposes only - remove in production
 */
router.post('/send-reminders', authMiddleware, async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const now = new Date();

    // Find overdue tasks for the current user
    const overdueTasks = await Task.find({
      user: authReq.user!._id,
      completed: false,
      dueDate: { $lt: now },
      reminderSent: { $ne: true },
    }).populate('user');

    if (overdueTasks.length === 0) {
      return res.json({
        success: true,
        message: 'No overdue tasks found to send reminders for',
        sent: 0,
      });
    }

    let sentCount = 0;
    const results = [];

    for (const task of overdueTasks) {
      try {
        const user = task.user as any;

        if (!user || !user.email) {
          results.push({
            taskId: task._id,
            status: 'skipped',
            reason: 'No user email',
          });
          continue;
        }

        const daysOverdue = Math.floor(
          (now.getTime() - task.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
        );

        await sendEmail({
          to: user.email,
          subject: `⏰ Task Reminder: "${task.title}" is overdue`,
          text: `Hello ${user.name || 'there'},

Your task "${task.title}" was due on ${task.dueDate!.toLocaleDateString()} and is now ${daysOverdue} day(s) overdue.

Please complete this task as soon as possible.

Task Details:
- Title: ${task.title}
- Priority: ${task.priority}
- Due Date: ${task.dueDate!.toLocaleDateString()}
${task.description ? `- Description: ${task.description}` : ''}

Best regards,
FocusAI Task Management Team`,
          html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #dc2626; margin-top: 0;">⏰ Task Overdue Reminder</h2>
    
    <p>Hello <strong>${user.name || 'there'}</strong>,</p>
    
    <p>Your task <strong>"${task.title}"</strong> was due on <strong>${task.dueDate!.toLocaleDateString()}</strong> and is now <span style="color: #dc2626; font-weight: bold;">${daysOverdue} day(s) overdue</span>.</p>
    
    <p>Please complete this task as soon as possible.</p>
    
    <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <h3 style="margin-top: 0; color: #991b1b;">Task Details</h3>
      <ul style="list-style: none; padding: 0;">
        <li><strong>Title:</strong> ${task.title}</li>
        <li><strong>Priority:</strong> <span style="text-transform: uppercase; color: ${
          task.priority === 'high' ? '#dc2626' : task.priority === 'medium' ? '#f59e0b' : '#10b981'
        };">${task.priority}</span></li>
        <li><strong>Due Date:</strong> ${task.dueDate!.toLocaleDateString()}</li>
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

        task.reminderSent = true;
        await task.save();

        sentCount++;
        results.push({
          taskId: task._id,
          taskTitle: task.title,
          status: 'sent',
          email: user.email,
        });
      } catch (error: any) {
        results.push({
          taskId: task._id,
          status: 'failed',
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Sent ${sentCount} reminder email(s)`,
      sent: sentCount,
      total: overdueTasks.length,
      results,
    });
  } catch (error: any) {
    console.error('Error in test reminder endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminders',
      error: error.message,
    });
  }
});

export default router;
