"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMotivation = exports.generateFocusPlan = void 0;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
// 🔹 Generate Focus Plan
const generateFocusPlan = async (req, res) => {
    try {
        const { tasks } = req.body;
        const prompt = `
    Analyze these tasks and create a 3-hour focus plan.
    Tasks: ${JSON.stringify(tasks)}
    Respond with a clear step-by-step plan.
    `;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });
        const result = completion.choices[0].message?.content;
        res.status(200).json({ plan: result });
    }
    catch (err) {
        res.status(500).json({ message: "AI plan generation failed", error: err });
    }
};
exports.generateFocusPlan = generateFocusPlan;
// 🔹 Generate Motivation
const generateMotivation = async (req, res) => {
    try {
        const { goals } = req.body;
        const prompt = `
    Generate a short motivational message based on today's goals: ${goals.join(", ")}.
    `;
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });
        const message = completion.choices[0].message?.content;
        res.status(200).json({ message });
    }
    catch (err) {
        res.status(500).json({ message: "AI motivation failed", error: err });
    }
};
exports.generateMotivation = generateMotivation;
