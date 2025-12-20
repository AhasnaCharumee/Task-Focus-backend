"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middlewares/auth");
const adminOnly_1 = require("../middlewares/adminOnly");
const router = (0, express_1.Router)();
/**
 * @route GET /api/admin/users
 * @desc  Get all users (Admin only)
 */
router.get("/users", auth_1.authMiddleware, adminOnly_1.adminOnly, adminController_1.getAllUsers);
/**
 * @route POST /api/admin/promote
 * @desc  Promote a user to admin role
 */
router.post("/promote", auth_1.authMiddleware, adminOnly_1.adminOnly, adminController_1.makeAdmin);
exports.default = router;
