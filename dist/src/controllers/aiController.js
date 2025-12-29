"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextSuggestions = exports.analyzeSentiment = exports.generateGoalBreakdown = exports.generateMotivation = exports.generateFocusPlan = void 0;
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
// 🔹 Goal breakdown (large goal -> actionable subtasks)
const generateGoalBreakdown = async (req, res) => {
    try {
        const { goal } = req.body;
        if (!goal)
            return res.status(400).json({ message: "Missing goal" });
        // If OpenAI key available, ask the model for a structured breakdown
        if (process.env.OPENAI_API_KEY) {
            const prompt = `Break the following goal into 6 actionable subtasks with short acceptance criteria and estimated time in hours. Goal: ${goal}`;
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });
            const result = completion.choices[0].message?.content;
            return res.status(200).json({ breakdown: result });
        }
        // Fallback heuristic: split by commas / 'and' and create simple subtasks
        const parts = goal.split(/,| and |;|\.|\n/).map((s) => s.trim()).filter(Boolean);
        const subtasks = parts.slice(0, 6).map((p, i) => ({
            title: p.length > 80 ? p.slice(0, 80) + "…" : p,
            acceptance: `Complete: ${p}`,
            estimateHours: 1,
            order: i + 1,
        }));
        return res.status(200).json({ breakdown: subtasks });
    }
    catch (err) {
        return res.status(500).json({ message: "Goal breakdown failed", error: String(err) });
    }
};
exports.generateGoalBreakdown = generateGoalBreakdown;
// 🔹 Sentiment analysis (lightweight)
const analyzeSentiment = async (req, res) => {
    try {
        const { texts } = req.body;
        if (!Array.isArray(texts))
            return res.status(400).json({ message: "Missing texts array" });
        // If OpenAI available, use the model for sentiment
        if (process.env.OPENAI_API_KEY) {
            const prompt = `Determine sentiment (positive/neutral/negative) for each of the following texts. Respond JSON array of {text, sentiment, score}: ${JSON.stringify(texts)}`;
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });
            const result = completion.choices[0].message?.content;
            return res.status(200).json({ sentiment: result });
        }
        // simple lexicon-based fallback
        const positive = ["good", "great", "happy", "done", "completed", "love", "awesome", "productive"];
        const negative = ["bad", "sad", "late", "overwhelmed", "fail", "angry", "stress", "stressed"];
        const out = texts.map((t) => {
            const low = (t || "").toLowerCase();
            let score = 0;
            positive.forEach((w) => { if (low.includes(w))
                score += 1; });
            negative.forEach((w) => { if (low.includes(w))
                score -= 1; });
            const sentiment = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
            const suggestion = sentiment === 'negative' ? 'Consider breaking this into smaller steps or scheduling it later.' : 'Looks good — consider scheduling a focused session.';
            return { text: t, sentiment, score, suggestion };
        });
        return res.status(200).json({ sentiment: out });
    }
    catch (err) {
        return res.status(500).json({ message: "Sentiment analysis failed", error: String(err) });
    }
};
exports.analyzeSentiment = analyzeSentiment;
// 🔹 Context-aware suggestions
const contextSuggestions = async (req, res) => {
    try {
        const { tasks } = req.body;
        if (!Array.isArray(tasks))
            return res.status(400).json({ message: "Missing tasks array" });
        // If OpenAI available, ask the model for prioritized suggestions
        if (process.env.OPENAI_API_KEY) {
            const prompt = `You are a productivity assistant. Given tasks: ${JSON.stringify(tasks)}, suggest top 5 tasks to do now based on urgency, due dates, and typical human focus (morning vs evening). Return JSON array of task ids in priority order.`;
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
            });
            const result = completion.choices[0].message?.content;
            return res.status(200).json({ suggestions: result });
        }
        // Rule-based fallback: prioritize by dueDate soon, status not done, and label keywords
        const now = new Date();
        const scoreTask = (t) => {
            let score = 0;
            if (t.status === 'done')
                score -= 1000;
            if (t.dueDate) {
                const d = new Date(t.dueDate);
                const diffH = (d.getTime() - now.getTime()) / 3600000;
                if (diffH <= 24)
                    score += 50;
                else if (diffH <= 72)
                    score += 20;
            }
            if (t.labels && t.labels.includes('urgent'))
                score += 30;
            if (t.priority === 'high')
                score += 40;
            // boost short tasks
            if (t.estimateMinutes && t.estimateMinutes <= 30)
                score += 10;
            return score;
        };
        const scored = tasks.map((t) => ({ task: t, score: scoreTask(t) }));
        scored.sort((a, b) => b.score - a.score);
        const suggestions = scored.slice(0, 5).map((s) => s.task);
        return res.status(200).json({ suggestions });
    }
    catch (err) {
        return res.status(500).json({ message: "Context suggestions failed", error: String(err) });
    }
};
exports.contextSuggestions = contextSuggestions;
