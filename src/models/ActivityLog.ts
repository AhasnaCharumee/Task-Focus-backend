import { Schema, model, Document, Types } from "mongoose";

export interface IActivityLog extends Document {
  user: Types.ObjectId;
  action: string;
  meta?: any;
  ip?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: true }
);

export const ActivityLog = model<IActivityLog>("ActivityLog", activityLogSchema);
