"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const validateRequest_1 = require("../middlewares/validateRequest");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post("/signup", (0, validateRequest_1.validateRequest)(["name", "email", "password"]), authController_1.signup);
/**
 * @route   POST /api/auth/login
 * @desc    Login existing user
 * @access  Public
 */
router.post("/login", (0, validateRequest_1.validateRequest)(["email", "password"]), authController_1.login);
/**
 * @route   POST /api/auth/google
 * @desc    Google Sign-in with ID Token
 * @access  Public
 */
router.post("/google", authController_1.googleAuth);
/**
 * Temporary: create admin user (unprotected). Use only for initial setup or testing.
 * POST /api/auth/create-admin
 */
router.post("/create-admin", (0, validateRequest_1.validateRequest)(["name", "email", "password"]), authController_1.createAdmin);
exports.default = router;
