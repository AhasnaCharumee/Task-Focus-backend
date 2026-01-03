import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// @ts-ignore - passport-github2 lacks type definitions
import { Strategy as GitHubStrategy } from 'passport-github2';
import * as admin from 'firebase-admin';
import { User } from '../models/User';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
}

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = new User({
            name: profile.displayName || profile.emails?.[0]?.value?.split('@')[0] || 'User',
            email: profile.emails?.[0]?.value || '',
            password: 'oauth-user-no-password',
            googleId: profile.id,
            role: 'user',
          });
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Firebase Authentication Handler
export const verifyFirebaseToken = async (idToken: string) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (err) {
    console.error('Firebase token verification error:', err);
    throw err;
  }
};

// Firebase User Lookup/Creation
export const handleFirebaseUser = async (firebaseId: string, email: string, name: string) => {
  try {
    let user = await User.findOne({ firebaseId });

    if (!user) {
      // Check if user already exists with this email
      user = await User.findOne({ email });
      
      if (user) {
        // Link Firebase ID to existing user
        user.firebaseId = firebaseId;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          name: name || email.split("@")[0],
          email,
          password: "oauth-user-no-password",
          firebaseId,
          role: "user",
        });
      }
    }

    return user;
  } catch (err) {
    console.error('Firebase user handling error:', err);
    throw err;
  }
};

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '',
      userAgent: 'FocusAI-App', // Required by GitHub API
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          const email = profile.emails?.[0]?.value || `${profile.id}@github.com`;
          
          // Check if user exists with same email (from Google, Firebase, or manual signup)
          user = await User.findOne({ email });
          
          if (user) {
            // Link GitHub ID to existing user
            user.githubId = profile.id;
            await user.save();
          } else {
            // Create new user
            user = new User({
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
      } catch (err) {
        console.error('GitHub strategy error:', err);
        return done(err);
      }
    }
  )
);


export default passport;
