"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const auth_1 = __importDefault(require("./routes/auth"));
const ai_1 = __importDefault(require("./routes/ai"));
const admin_1 = __importDefault(require("./routes/admin"));
const categories_1 = __importDefault(require("./routes/categories"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const export_1 = __importDefault(require("./routes/export"));
const profile_1 = __importDefault(require("./routes/profile"));
const settings_1 = __importDefault(require("./routes/settings"));
const feedback_1 = __importDefault(require("./routes/feedback"));
const testReminder_1 = __importDefault(require("./routes/testReminder"));
const testAdmin_1 = __importDefault(require("./routes/testAdmin"));
const db_1 = __importDefault(require("./config/db"));
const passport_1 = __importDefault(require("./config/passport"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: (incomingOrigin, callback) => {
        if (!incomingOrigin)
            return callback(null, true);
        try {
            const url = new URL(incomingOrigin);
            if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
                return callback(null, true);
            }
        }
        catch (e) { }
        const allowed = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
        if (allowed.includes(incomingOrigin))
            return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
});
app.get("/", (req, res) => {
    res.status(200).send("Task Focus API is running");
});
app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
});
const PORT = 3000;
const start = async () => {
    await (0, db_1.default)();
    app.use(passport_1.default.initialize());
    app.use("/api/auth", auth_1.default);
    app.use("/api/tasks", tasks_1.default);
    app.use("/api/ai", ai_1.default);
    app.use("/api/admin", admin_1.default);
    app.use("/api/categories", categories_1.default);
    app.use("/api/notifications", notifications_1.default);
    app.use("/api/export", export_1.default);
    app.use("/api/profile", profile_1.default);
    app.use("/api/settings", settings_1.default);
    app.use("/api/feedback", feedback_1.default);
    app.use("/api/test", testReminder_1.default);
    app.use("/api/test", testAdmin_1.default);
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
};
start();
exports.default = app;
