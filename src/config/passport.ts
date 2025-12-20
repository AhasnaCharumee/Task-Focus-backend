import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
// @ts-ignore - passport-github2 lacks type definitions
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/User';

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
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

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'photos'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        let user = await User.findOne({ facebookId: profile.id });

        if (!user) {
          user = new User({
            name: profile.displayName || 'User',
            email: `${profile.id}@facebook.com`, // Generate email from Facebook ID
            password: 'oauth-user-no-password',
            facebookId: profile.id,
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

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
      userAgent: 'FocusAI-App', // Required by GitHub API
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          const email = profile.emails?.[0]?.value || `${profile.id}@github.com`;
          
          // Check if user exists with same email (from Google, Facebook, or manual signup)
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

passport.serializeUser((user: any, done: any) => {
  done(null, user._id);
});

passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
