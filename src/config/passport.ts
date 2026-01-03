import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// @ts-ignore - passport-github2 lacks type definitions
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/User';

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
