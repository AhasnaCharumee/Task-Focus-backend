"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const analyticsController_1 = require("../controllers/analyticsController");
const router = express_1.default.Router();
// User analytics endpoint
router.get("/", auth_1.authMiddleware, analyticsController_1.getAnalytics);
exports.default = router;
