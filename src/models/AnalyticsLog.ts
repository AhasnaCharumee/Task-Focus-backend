import { Schema, model, Document, Types } from "mongoose";

export interface IAnalyticsLog extends Document {
  user: Types.ObjectId;
  date: Date;
  totalTasks: number;
  completedTasks: number;
  focusHours: number;
}

const analyticsLogSchema = new Schema<IAnalyticsLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    focusHours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AnalyticsLog = model<IAnalyticsLog>(
  "AnalyticsLog",
  analyticsLogSchema
);
