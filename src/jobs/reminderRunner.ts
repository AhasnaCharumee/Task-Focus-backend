import { Task } from "../models/Task";
import { Notification } from "../models/Notification";
import { sendEmail } from "../utils/email";
import notificationEmitter from "../utils/notificationEmitter";

function minutesBefore(date: Date, minutes: number) {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

export function startReminderWorker(pollIntervalMs = 60 * 1000) {
  console.log("Starting reminder worker, polling every", pollIntervalMs, "ms");

  const work = async () => {
    try {
      const now = new Date();
      // Find tasks that have dueDate and reminders
      const tasks = await Task.find({ dueDate: { $exists: true, $ne: null }, reminders: { $exists: true, $ne: [] } }).exec();

      for (const t of tasks) {
        try {
          if (!t.dueDate) continue;
          const due = new Date(t.dueDate);
          for (const mins of (t.reminders || [])) {
            const remindAt = minutesBefore(due, Number(mins));
            // if it's time (or past) and we haven't sent this reminder for this task
            if (remindAt <= now) {
              const existing = await Notification.findOne({ task: t._id, reminderMinutes: mins, type: "reminder" }).exec();
              if (existing) continue; // already sent

              // create notification record (in-app)
              const message = `Reminder: ${t.title} is due ${due.toISOString()}`;
              const notif = new Notification({
                user: t.user,
                task: t._id,
                type: "reminder",
                message,
                viaInApp: true,
                reminderMinutes: mins,
                sentAt: new Date(),
              });
              // save in-app notification, then emit and attempt email send
              await notif.save();
              // emit in-process event so SSE/WebSocket clients can receive realtime notifications
              try {
                notificationEmitter.emit("notification", notif);
              } catch (e) {
                console.error("Emitter error:", e);
              }

              // attempt to send email (sendEmail has retry/backoff). If sent, update notif.viaEmail
              if (process.env.SMTP_HOST) {
                try {
                  // populate user to get email
                  await notif.populate("user");
                  const populatedUser: any = (notif as any).user;
                  const to = populatedUser?.email;
                  if (to) {
                    const emailed = await sendEmail(to, `Task reminder: ${t.title}`, message);
                    if (emailed) {
                      notif.viaEmail = true;
                      await notif.save();
                    }
                  }
                } catch (e) {
                  console.error("Failed to send reminder email", e);
                }
              }
            }
          }
        } catch (inner) {
          console.error("Error processing reminders for task", t._id, inner);
        }
      }
    } catch (err) {
      console.error("Reminder worker error:", err);
    }
  };

  work();
  const id = setInterval(work, pollIntervalMs);
  return () => clearInterval(id);
}

export default startReminderWorker;
