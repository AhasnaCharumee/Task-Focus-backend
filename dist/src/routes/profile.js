"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const profileController_1 = require("../controllers/profileController");
const router = (0, express_1.Router)();
router.get("/", auth_1.authMiddleware, profileController_1.getProfile);
// Validate token and return current user info
router.get("/validate", auth_1.authMiddleware, (req, res) => {
    const authReq = req;
    return res.json({ user: authReq.user });
});
router.put("/", auth_1.authMiddleware, profileController_1.updateProfile);
router.get("/activity", auth_1.authMiddleware, profileController_1.getActivity);
exports.default = router;
