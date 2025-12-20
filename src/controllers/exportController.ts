import { Request, Response } from "express";
import { Task } from "../models/Task";
import { AuthRequest } from "../middlewares/auth";
// Load pdfkit and csv-parse dynamically at runtime to avoid crashing the server
let PDFDocument: any = null;
let csvParse: any = null;

// Helper to escape CSV fields
function esc(val: any) {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export const exportTasksCsv = async (req: Request, res: Response) => {
  try {
    const auth = req as AuthRequest;
    const userId = auth.user?._id || req.query.userId;

    const filter: any = {};
    if (userId) filter.user = userId;
    if (req.query.start || req.query.end) {
      filter.$or = [
        { dueDate: { $gte: req.query.start ? new Date(String(req.query.start)) : new Date(0) } },
        { dueDate: { $lte: req.query.end ? new Date(String(req.query.end)) : new Date(8640000000000000) } },
      ];
    }

    const tasks = await Task.find(filter).populate("categories").lean();

    const headers = [
      "_id",
      "title",
      "description",
      "status",
      "dueDate",
      "labels",
      "categories",
      "createdAt",
      "updatedAt",
    ];

    const rows = tasks.map((t: any) => {
      return [
        esc(t._id),
        esc(t.title),
        esc(t.description),
        esc(t.status),
        esc(t.dueDate ? new Date(t.dueDate).toISOString() : ""),
        esc((t.labels || []).join(";")),
        esc((t.categories || []).map((c: any) => (c.name ? c.name : String(c))).join(";")),
        esc(t.createdAt ? new Date(t.createdAt).toISOString() : ""),
        esc(t.updatedAt ? new Date(t.updatedAt).toISOString() : ""),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=tasks_${Date.now()}.csv`);
    res.send(csv);
  } catch (err: any) {
    console.error("exportTasksCsv error:", err);
    res.status(500).json({ message: "Export failed", error: err?.message || String(err) });
  }
};

export const exportTasksPdf = async (req: Request, res: Response) => {
  try {
    // Dynamically import pdfkit when needed
    if (!PDFDocument) {
      try {
        const mod = await import("pdfkit");
        PDFDocument = mod.default || mod;
      } catch (e) {
        console.error("PDF export requested but pdfkit is not installed:", e);
        return res.status(500).json({ message: "PDF export requires 'pdfkit' package. Run 'npm install pdfkit' to enable." });
      }
    }
    const auth = req as AuthRequest;
    const userId = auth.user?._id || req.query.userId;

    const filter: any = {};
    if (userId) filter.user = userId;
    if (req.query.start || req.query.end) {
      filter.dueDate = {} as any;
      if (req.query.start) filter.dueDate.$gte = new Date(String(req.query.start));
      if (req.query.end) filter.dueDate.$lte = new Date(String(req.query.end));
    }

    const tasks = await Task.find(filter).populate("categories").lean();

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=tasks_${Date.now()}.pdf`);

    doc.pipe(res);

    doc.fontSize(18).text("Task Export", { align: "center" });
    doc.moveDown();

    tasks.forEach((t: any, idx: number) => {
      doc.fontSize(12).fillColor("black").text(`${idx + 1}. ${t.title}`);
      if (t.description) doc.fontSize(10).fillColor("gray").text(t.description);
      doc.fontSize(10).fillColor("black").text(`Status: ${t.status || "-"} | Due: ${t.dueDate ? new Date(t.dueDate).toLocaleString() : "-"}`);
      if (t.labels && t.labels.length) doc.text(`Labels: ${t.labels.join(", ")}`);
      if (t.categories && t.categories.length) doc.text(`Categories: ${(t.categories || []).map((c: any) => c.name || c).join(", ")}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err: any) {
    console.error("exportTasksPdf error:", err);
    res.status(500).json({ message: "PDF export failed", error: err?.message || String(err) });
  }
};

export const importTasksCsv = async (req: Request, res: Response) => {
  try {
    // multer will provide file buffer on req.file
    const auth = req as AuthRequest;
    const userId = auth.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const file = (req as any).file;
    if (!file || !file.buffer) return res.status(400).json({ message: "Missing file" });

    // Dynamically import csv-parse when needed
    if (!csvParse) {
      try {
        const mod = await import("csv-parse/sync");
        csvParse = mod.parse || mod.default || mod;
      } catch (e) {
        console.error("CSV import requested but csv-parse is not installed:", e);
        return res.status(500).json({ message: "CSV import requires 'csv-parse' package. Run 'npm install csv-parse' to enable." });
      }
    }

    const content = file.buffer.toString("utf8");
    const records = csvParse(content, { columns: true, skip_empty_lines: true });

    const created: any[] = [];

    for (const r of records) {
      // expect columns: title,description,status,dueDate,labels
      const taskData: any = {
        title: r.title || r.Title || "Untitled",
        description: r.description || r.Description || "",
        status: r.status || r.Status || "todo",
        user: userId,
      };
      if (r.dueDate) taskData.dueDate = new Date(r.dueDate);
      if (r.labels) taskData.labels = String(r.labels).split(";").map((s: string) => s.trim()).filter(Boolean);

      const t = await Task.create(taskData);
      created.push(t);
    }

    res.status(201).json({ message: "Imported", count: created.length, created });
  } catch (err: any) {
    console.error("importTasksCsv error:", err);
    res.status(500).json({ message: "Import failed", error: err?.message || String(err) });
  }
};
