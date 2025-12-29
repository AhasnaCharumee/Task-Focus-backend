"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const router = (0, express_1.Router)();
// Public read-only access to some settings
router.get("/:key", settingsController_1.getSettingPublic);
exports.default = router;
