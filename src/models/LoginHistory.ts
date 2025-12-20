import { Schema, model, Document, Types } from "mongoose";

export interface ILoginHistory extends Document {
  user: Types.ObjectId;
  ip?: string;
  userAgent?: string;
  success: boolean;
  createdAt: Date;
}

const loginHistorySchema = new Schema<ILoginHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    ip: String,
    userAgent: String,
    success: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LoginHistory = model<ILoginHistory>("LoginHistory", loginHistorySchema);
