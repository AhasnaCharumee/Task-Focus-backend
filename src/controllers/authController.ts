import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { signToken } from "../utils/jwt";
import { OAuth2Client } from "google-auth-library";
import { LoginHistory } from "../models/LoginHistory";

// SIGNUP (user only)
export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('signup body:', req.body);
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, role: "user" });

    const token = signToken({ id: user._id, email: user.email, role: user.role });

    // record successful signup/login event
    try {
      await LoginHistory.create({ user: user._id, ip: req.ip, userAgent: req.headers["user-agent"] as string, success: true });
    } catch (e) {
      console.warn("Failed to write LoginHistory on signup:", e);
    }

    res.status(201).json({
      message: "User created",
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (err: any) {
    console.error('signup error:', err);
    // Return error details during debugging to help trace the issue
    return res.status(500).json({ message: 'Signup failed', error: err?.message || String(err) });
  }
};


// ADMIN CREATE (admin-only action)
export const createAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Guard: require a one-time secret to create admin via this endpoint
    const secret = req.headers["x-admin-secret"] || req.body?.secret;
    const expected = process.env.ADMIN_CREATE_SECRET;
    if (!expected) {
      return res.status(500).json({ message: "ADMIN_CREATE_SECRET not configured on server" });
    }
    if (!secret || String(secret) !== expected) {
      return res.status(403).json({ message: "Forbidden - invalid admin creation secret" });
    }

    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Admin already exists" });

    const hashed = await bcrypt.hash(password, 12);
    const admin = await User.create({ name, email, password: hashed, role: "admin" });

    res.status(201).json({ message: "Admin created", admin });
  } catch (err: any) {
    return res.status(500).json({ message: "Admin creation failed", error: err?.message || String(err) });
  }
};


// LOGIN
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const user: any = await User.findOne({ email });
    if (!user) {
      // log failed attempt without a user reference
      try { await LoginHistory.create({ ip: req.ip, userAgent: req.headers["user-agent"] as string, success: false, }); } catch (e) { console.warn(e); }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      try { await LoginHistory.create({ user: user._id, ip: req.ip, userAgent: req.headers["user-agent"] as string, success: false }); } catch (e) { console.warn(e); }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({
      message: "Logged in",
      token,
      user: {
        _id: user._id,
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    try { await LoginHistory.create({ user: user._id, ip: req.ip, userAgent: req.headers["user-agent"] as string, success: true }); } catch (e) { console.warn(e); }
  } catch (err: any) {
    return res.status(500).json({ message: "Login failed", error: err?.message || String(err) });
  }
};


// GOOGLE AUTH

export const googleSignIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[DEBUG] googleAuth body:', req.body);
    // Expect frontend to send Google ID token (issued to your Google client id)
    const { idToken } = req.body;
    if (!idToken) {
      console.error('[ERROR] Missing idToken in request body');
      return res.status(400).json({ message: "Missing idToken" });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    let ticket, payload;
    try {
      ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch (verifyErr: any) {
      console.error('[ERROR] Google ID token verification failed:', verifyErr?.message || String(verifyErr));
      return res.status(400).json({ message: "Invalid Google token", error: verifyErr?.message || String(verifyErr) });
    }

    if (!payload || !payload.email) {
      console.error('[ERROR] Google token payload missing email:', payload);
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const email = payload.email;
    const name = payload.name || payload.email.split("@") [0];
    const googleId = payload.sub; // Google's unique user id

    let user: any;
    try {
      user = await User.findOne({ email });
    } catch (dbFindErr: any) {
      console.error('[ERROR] User.findOne failed:', dbFindErr?.message || String(dbFindErr));
      return res.status(500).json({ message: "Database error", error: dbFindErr?.message || String(dbFindErr) });
    }
    if (!user) {
      // For OAuth-created users, generate a random password and store its hash
      const randomPass = Math.random().toString(36).slice(2) + Date.now().toString(36);
      let hashed;
      try {
        hashed = await bcrypt.hash(randomPass, 12);
      } catch (hashErr: any) {
        console.error('[ERROR] bcrypt.hash failed:', hashErr?.message || String(hashErr));
        return res.status(500).json({ message: "Password hash error", error: hashErr?.message || String(hashErr) });
      }
      try {
        user = await User.create({ name, email, password: hashed, role: "user", googleId });
      } catch (createErr: any) {
        console.error('[ERROR] User.create failed:', createErr?.message || String(createErr));
        return res.status(500).json({ message: "User creation error", error: createErr?.message || String(createErr) });
      }
    } else if (!user.googleId && googleId) {
      // If user exists but googleId not set (they previously signed up with email), link the Google id
      user.googleId = googleId;
      try {
        await user.save();
      } catch (saveErr: any) {
        console.error('[ERROR] user.save() failed:', saveErr?.message || String(saveErr));
        return res.status(500).json({ message: "User update error", error: saveErr?.message || String(saveErr) });
      }
    }

    let token;
    try {
      token = signToken({ id: user._id, email: user.email, role: user.role });
    } catch (tokenErr: any) {
      console.error('[ERROR] signToken failed:', tokenErr?.message || String(tokenErr));
      return res.status(500).json({ message: "Token generation error", error: tokenErr?.message || String(tokenErr) });
    }

    res.status(200).json({
      message: "Google login successful",
      token,
      user: { _id: user._id, id: user._id, email: user.email, name: user.name, role: user.role },
    });

    try { await LoginHistory.create({ user: user._id, ip: req.ip, userAgent: req.headers["user-agent"] as string, success: true }); } catch (e) { console.warn('[WARN] LoginHistory.create failed:', e); }
  } catch (err: any) {
    console.error("[FATAL] googleAuth error:", err);
    try { await LoginHistory.create({ ip: req.ip, userAgent: req.headers["user-agent"] as string, success: false }); } catch (e) { console.warn('[WARN] LoginHistory.create failed:', e); }
    return res.status(500).json({ message: "Google login failed", error: err?.message || String(err) });
  }
};
