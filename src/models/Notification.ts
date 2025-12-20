import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  task?: mongoose.Types.ObjectId;
  type: "reminder" | "system" | string;
  message: string;
  viaEmail?: boolean;
  viaInApp?: boolean;
  reminderMinutes?: number; // which reminder (minutes before) triggered this
  sentAt?: Date;
  read?: boolean;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    task: { type: Schema.Types.ObjectId, ref: "Task" },
    type: { type: String, default: "reminder" },
    message: { type: String, required: true },
    viaEmail: { type: Boolean, default: false },
    viaInApp: { type: Boolean, default: true },
    reminderMinutes: Number,
    sentAt: Date,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
