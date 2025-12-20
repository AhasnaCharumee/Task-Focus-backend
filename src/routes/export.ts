
import { Router } from "express";
import { exportTasksCsv, exportTasksPdf, importTasksCsv } from "../controllers/exportController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

// Dynamically require multer to avoid crashing when it's not installed
let upload: any;
try {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const multer = require("multer");
	upload = multer({ storage: multer.memoryStorage() });
} catch (e) {
	console.warn("multer is not installed; CSV import endpoint will return an informative error.");
	upload = {
		single: () => (req: any, res: any) => {
			res.status(500).json({ message: "CSV import requires 'multer'. Run 'npm install multer' to enable this endpoint." });
		},
	};
}

// Protect exports/imports
router.use(authMiddleware);

// GET /api/export/csv
router.get("/csv", exportTasksCsv);
// GET /api/export/pdf
router.get("/pdf", exportTasksPdf);
// POST /api/export/import (multipart form, file field 'file')
router.post("/import", upload.single("file"), importTasksCsv);

export default router;
