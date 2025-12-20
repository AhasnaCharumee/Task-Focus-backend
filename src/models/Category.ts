import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  color?: string;
  user?: mongoose.Types.ObjectId; // optional owner (for personal categories)
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Category = mongoose.model<ICategory>("Category", CategorySchema);
