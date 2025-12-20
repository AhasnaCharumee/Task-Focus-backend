import { Request, Response, NextFunction } from "express";
import { Category } from "../models/Category";

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // optionally filter by user
    const userId = (req as any).user?._id;
    const filter: any = {};
    if (userId) filter.user = userId;

    const categories = await Category.find(filter).sort({ name: 1 });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, color } = req.body;
    const userId = (req as any).user?._id;
    const category = await Category.create({ name, color, user: userId });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const category = await Category.findByIdAndUpdate(id, { name, color }, { new: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ category });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const cat = await Category.findByIdAndDelete(id);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
};
