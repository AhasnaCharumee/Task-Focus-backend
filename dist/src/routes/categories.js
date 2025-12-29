"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoriesController_1 = require("../controllers/categoriesController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All category routes require auth
router.use(auth_1.authMiddleware);
router.get("/", categoriesController_1.getCategories);
router.post("/", categoriesController_1.createCategory);
router.put("/:id", categoriesController_1.updateCategory);
router.delete("/:id", categoriesController_1.deleteCategory);
exports.default = router;
