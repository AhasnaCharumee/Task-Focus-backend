import { Schema, model, Document, Types } from "mongoose";

export interface IFeedback extends Document {
  user?: Types.ObjectId;
  message: string;
  type?: "bug" | "feature" | "other";
  status?: "open" | "in_progress" | "closed";
  meta?: any;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    message: { type: String, required: true },
    type: { type: String, enum: ["bug", "feature", "other"], default: "other" },
    status: { type: String, enum: ["open", "in_progress", "closed"], default: "open" },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Feedback = model<IFeedback>("Feedback", feedbackSchema);
