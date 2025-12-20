"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (requiredFields) => (req, res, next) => {
    const missing = requiredFields.filter(f => !req.body[f]);
    if (missing.length > 0) {
        return res
            .status(400)
            .json({ message: `Missing required fields: ${missing.join(", ")}` });
    }
    next();
};
exports.validateRequest = validateRequest;
