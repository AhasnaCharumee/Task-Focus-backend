import { Schema, model, Document } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  body: string;
  scheduledAt?: Date;
  sendImmediately?: boolean;
  active?: boolean;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    scheduledAt: Date,
    sendImmediately: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Announcement = model<IAnnouncement>("Announcement", announcementSchema);
