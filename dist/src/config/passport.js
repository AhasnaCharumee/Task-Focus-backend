"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
// @ts-ignore - passport-github2 lacks type definitions
const passport_github2_1 = require("passport-github2");
const User_1 = require("../models/User");
// Google OAuth Strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User_1.User.findOne({ googleId: profile.id });
        if (!user) {
            user = new User_1.User({
                name: profile.displayName || profile.emails?.[0]?.value?.split('@')[0] || 'User',
                email: profile.emails?.[0]?.value || '',
                password: 'oauth-user-no-password',
                googleId: profile.id,
                role: 'user',
            });
            await user.save();
        }
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
}));
// Facebook OAuth Strategy
passport_1.default.use(new passport_facebook_1.Strategy({
    clientID: process.env.FACEBOOK_APP_ID || '',
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackURL: "", // Required by types, set dynamically in route
    profileFields: ['id', 'displayName', 'photos'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User_1.User.findOne({ facebookId: profile.id });
        if (!user) {
            user = new User_1.User({
                name: profile.displayName || 'User',
                email: `${profile.id}@facebook.com`, // Generate email from Facebook ID
                password: 'oauth-user-no-password',
                facebookId: profile.id,
                role: 'user',
            });
            await user.save();
        }
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
}));
// GitHub OAuth Strategy
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    userAgent: 'FocusAI-App', // Required by GitHub API
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User_1.User.findOne({ githubId: profile.id });
        if (!user) {
            const email = profile.emails?.[0]?.value || `${profile.id}@github.com`;
            // Check if user exists with same email (from Google, Facebook, or manual signup)
            user = await User_1.User.findOne({ email });
            if (user) {
                // Link GitHub ID to existing user
                user.githubId = profile.id;
                await user.save();
            }
            else {
                // Create new user
                user = new User_1.User({
                    name: profile.displayName || profile.username || 'User',
                    email: email,
                    password: 'oauth-user-no-password',
                    githubId: profile.id,
                    role: 'user',
                });
                await user.save();
            }
        }
        return done(null, user);
    }
    catch (err) {
        console.error('GitHub strategy error:', err);
        return done(err);
    }
}));
exports.default = passport_1.default;
