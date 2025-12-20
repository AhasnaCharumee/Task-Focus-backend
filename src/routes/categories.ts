import { Router } from "express";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/categoriesController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// All category routes require auth
router.use(authMiddleware);

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
