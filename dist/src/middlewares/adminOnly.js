"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = void 0;
const adminOnly = (req, res, next) => {
    const authReq = req;
    if (!authReq.user || authReq.user.role !== "admin") {
        console.warn("Unauthorized admin access attempt:", authReq.user?.email);
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
};
exports.adminOnly = adminOnly;
