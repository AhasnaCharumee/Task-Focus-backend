"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
// Use Express-compatible signature and normalise decoded token into user._id
const authMiddleware = (req, res, next) => {
    const authReq = req;
    try {
        const authHeader = authReq.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = (0, jwt_1.verifyToken)(token);
        // normalize common id shapes: decoded.id or decoded._id or decoded.userId
        const userId = decoded?.id || decoded?._id || decoded?.userId;
        authReq.user = {
            _id: userId,
            id: userId,
            email: decoded?.email,
            role: decoded?.role,
        };
        next();
    }
    catch (error) {
        return res.status(403).json({ message: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
