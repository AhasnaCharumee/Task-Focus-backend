import { Request, Response } from "express";
import { Task } from "../models/Task";
import { AuthRequest } from "../middlewares/auth";

// 🔹 Get Analytics
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({ user: userId, completed: true });
    const pendingTasks = totalTasks - completedTasks;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    res.status(200).json({
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate: parseFloat(completionRate.toFixed(1)),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching analytics", error: err });
  }
};
