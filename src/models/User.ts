import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  googleId?: string;
  firebaseId?: string;
  githubId?: string;
  role: "user" | "admin"; // 🔥 NEW
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    // optional Google subject id for users created via Google Sign-In
    googleId: { type: String },
    // optional Firebase id for users created via Firebase Sign-In
    firebaseId: { type: String },
    // optional GitHub id for users created via GitHub Sign-In
    githubId: { type: String },

    // 🔥 Add role field
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
