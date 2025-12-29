"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exportController_1 = require("../controllers/exportController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Dynamically require multer to avoid crashing when it's not installed
let upload;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const multer = require("multer");
    upload = multer({ storage: multer.memoryStorage() });
}
catch (e) {
    console.warn("multer is not installed; CSV import endpoint will return an informative error.");
    upload = {
        single: () => (req, res) => {
            res.status(500).json({ message: "CSV import requires 'multer'. Run 'npm install multer' to enable this endpoint." });
        },
    };
}
// Protect exports/imports
router.use(auth_1.authMiddleware);
// GET /api/export/csv
router.get("/csv", exportController_1.exportTasksCsv);
// GET /api/export/pdf
router.get("/pdf", exportController_1.exportTasksPdf);
// POST /api/export/import (multipart form, file field 'file')
router.post("/import", upload.single("file"), exportController_1.importTasksCsv);
exports.default = router;
