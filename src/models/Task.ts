import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  completed?: boolean;
  dueDate?: Date;
  user: mongoose.Types.ObjectId;
  categories?: mongoose.Types.ObjectId[];
  labels?: string[];
  recurrence?: {
    enabled?: boolean;
    frequency?: "daily" | "weekly" | "monthly";
    interval?: number; // every N days/weeks/months
    daysOfWeek?: number[]; // for weekly recurrence: 0 (Sun) - 6 (Sat)
    startDate?: Date;
    endDate?: Date;
    nextRun?: Date;
    lastRun?: Date;
  };
  reminders?: number[]; // minutes before dueDate to send reminders
  reminderSent?: boolean; // track if overdue email reminder has been sent
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: String,
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ["low", "medium", "high"], default: "low" },
    dueDate: Date,
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    labels: { type: [String], default: [] },
    recurrence: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "daily" },
      interval: { type: Number, default: 1 },
      daysOfWeek: [{ type: Number }],
      startDate: Date,
      endDate: Date,
      nextRun: Date,
      lastRun: Date,
    },
    reminders: { type: [Number], default: [] },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>("Task", TaskSchema);
