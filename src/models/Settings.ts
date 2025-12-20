import { Schema, model, Document } from "mongoose";

export interface ISettings extends Document {
  key: string;
  value: any;
  description?: string;
}

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, default: {} },
    description: { type: String },
  },
  { timestamps: true }
);

export const Settings = model<ISettings>("Settings", settingsSchema);
