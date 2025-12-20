import { Schema, model, Document, Types } from "mongoose";

export interface IFocusPlan extends Document {
  user: Types.ObjectId;
  tasks: string[];
  aiSummary: string;
  createdAt: Date;
}

const focusPlanSchema = new Schema<IFocusPlan>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tasks: [{ type: String, required: true }],
    aiSummary: { type: String, required: true },
  },
  { timestamps: true }
);

export const FocusPlan = model<IFocusPlan>("FocusPlan", focusPlanSchema);
