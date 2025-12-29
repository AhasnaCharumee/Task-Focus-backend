"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const Category_1 = require("../models/Category");
const getCategories = async (req, res, next) => {
    try {
        // optionally filter by user
        const userId = req.user?._id;
        const filter = {};
        if (userId)
            filter.user = userId;
        const categories = await Category_1.Category.find(filter).sort({ name: 1 });
        res.json({ categories });
    }
    catch (err) {
        next(err);
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res, next) => {
    try {
        const { name, color } = req.body;
        const userId = req.user?._id;
        const category = await Category_1.Category.create({ name, color, user: userId });
        res.status(201).json({ category });
    }
    catch (err) {
        next(err);
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, color } = req.body;
        const category = await Category_1.Category.findByIdAndUpdate(id, { name, color }, { new: true });
        if (!category)
            return res.status(404).json({ message: "Category not found" });
        res.json({ category });
    }
    catch (err) {
        next(err);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const cat = await Category_1.Category.findByIdAndDelete(id);
        if (!cat)
            return res.status(404).json({ message: "Category not found" });
        res.json({ message: "Category deleted" });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteCategory = deleteCategory;
