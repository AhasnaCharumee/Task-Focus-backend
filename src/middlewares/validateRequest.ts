import { Request, Response, NextFunction } from "express";

export const validateRequest =
  (requiredFields: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const missing = requiredFields.filter(f => !req.body[f]);
    if (missing.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing required fields: ${missing.join(", ")}` });
    }
    next();
  };
