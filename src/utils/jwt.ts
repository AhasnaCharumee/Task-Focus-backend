import jwt, { SignOptions, Secret } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET: Secret = process.env.JWT_SECRET || "secret";

// cast expiresIn as string (fallback handled)
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

export const signToken = (payload: object) => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as unknown as any };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
