import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { signToken } from "../utils/jwt";

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const admin: any = await User.findOne({ email });
    if (!admin) return res.status(401).json({ message: "Invalid email or password" });

    const passOk = await bcrypt.compare(password, admin.password);
    if (!passOk) return res.status(401).json({ message: "Invalid email or password" });

    if (admin.role !== "admin") {
      return res.status(403).json({ message: "Not an admin account" });
    }

    // Only allow focusai.reminder.bot@gmail.com as admin
    if (admin.email !== "focusai.reminder.bot@gmail.com") {
      return res.status(403).json({ message: "Unauthorized admin account" });
    }

    const token = signToken({
      id: admin._id,
      email: admin.email,
      role: admin.role,
    });

    return res.status(200).json({
      message: "Admin Login Successful",
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (err) {
    console.error("adminLogin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
