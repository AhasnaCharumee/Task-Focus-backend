"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTasks = exports.createTask = void 0;
const Task_1 = require("../models/Task");
const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate } = req.body;
        const task = new Task_1.Task({
            title,
            description,
            priority,
            dueDate,
            user: req.user.userId,
        });
        await task.save();
        res.status(201).json({ message: "Task created", task });
    }
    catch (err) {
        res.status(500).json({ message: "Creating task failed", err });
    }
};
exports.createTask = createTask;
const getTasks = async (req, res) => {
    try {
        const tasks = await Task_1.Task.find({ user: req.user.userId }).sort({
            createdAt: -1,
        });
        res.json(tasks);
    }
    catch (err) {
        res.status(500).json({ message: "Fetching tasks failed", err });
    }
};
exports.getTasks = getTasks;
const updateTask = async (req, res) => {
    try {
        const updated = await Task_1.Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        if (!updated)
            return res.status(404).json({ message: "Task not found" });
        res.json({ message: "Task updated", updated });
    }
    catch (err) {
        res.status(500).json({ message: "Updating task failed", err });
    }
};
exports.updateTask = updateTask;
const deleteTask = async (req, res) => {
    try {
        const deleted = await Task_1.Task.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ message: "Task not found" });
        res.json({ message: "Task deleted" });
    }
    catch (err) {
        res.status(500).json({ message: "Deleting task failed", err });
    }
};
exports.deleteTask = deleteTask;
