# Facebook OAuth Setup Guide

## ✅ Implementation Complete

The Facebook OAuth login has been successfully implemented in your backend. Here's what was done:

### 1. **Routes Added** ([src/routes/auth.ts](src/routes/auth.ts))
- `GET /api/auth/facebook` - Initiates Facebook OAuth flow
- `GET /api/auth/facebook/callback` - Handles Facebook callback and generates JWT

### 2. **Passport Strategy** ([src/config/passport.ts](src/config/passport.ts))
- Facebook OAuth strategy configured
- Requests user profile fields: id, displayName, emails, photos
- Creates/finds user in database with facebookId
- Uses real email if available, otherwise generates fallback email

### 3. **User Model** ([src/models/User.ts](src/models/User.ts))
- Already has `facebookId` field for Facebook users

---

## 🔧 Configuration Required

### Step 1: Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose app type: "Consumer" or "Business"
4. Fill in app details and create

### Step 2: Configure Facebook Login
1. In your Facebook app dashboard, go to "Products"
2. Add "Facebook Login" product
3. In Facebook Login Settings, add these **Valid OAuth Redirect URIs**:
   ```
   http://localhost:5000/api/auth/facebook/callback
   https://your-backend-domain.com/api/auth/facebook/callback
   ```

### Step 3: Get App Credentials
1. Go to Settings → Basic
2. Copy **App ID** and **App Secret**

### Step 4: Update Environment Variables
Update your `.env` file with:

```env
# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# Make sure these are also set
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
```

**For Production:**
```env
FACEBOOK_CALLBACK_URL=https://your-backend-domain.com/api/auth/facebook/callback
FRONTEND_URL=https://your-frontend-domain.com
```

---

## 🔄 How It Works

1. **User clicks "Login with Facebook" on frontend**
   - Frontend redirects to: `${API_URL}/auth/facebook`

2. **Backend initiates OAuth flow**
   - User is redirected to Facebook login page
   - Facebook authenticates user

3. **Facebook redirects back to callback**
   - URL: `${API_URL}/auth/facebook/callback?code=...`
   - Backend exchanges code for access token
   - Fetches user profile from Facebook

4. **Backend processes user**
   - Finds existing user by `facebookId` or creates new user
   - Generates JWT token

5. **Backend redirects to frontend**
   - URL: `${FRONTEND_URL}/auth-callback?token=${jwt}`
   - Frontend stores token and completes login

---

## 🧪 Testing

### Test Locally:
1. Make sure backend is running on port 5000
2. Make sure `.env` has correct Facebook credentials
3. On frontend, click "Login with Facebook"
4. You should be redirected to Facebook login
5. After authentication, you'll be redirected back with a token

### Check Logs:
Look for this in your backend console:
```
[FACEBOOK LOGIN] user@example.com USER
```

---

## ⚠️ Important Notes

1. **Email Permission**: Facebook may not always provide the user's email. The backend handles this by generating a fallback email: `{facebookId}@facebook.com`

2. **Facebook App Review**: For production, you may need to submit your app for Facebook review to access certain permissions like email.

3. **HTTPS Required**: Facebook requires HTTPS for production callback URLs.

4. **Test Users**: Use Facebook's test users feature during development.

---

## 🚨 Troubleshooting

### "Cannot GET /api/auth/facebook"
- ✅ Routes are implemented, this error should be fixed now
- Make sure backend is running
- Check that auth routes are registered in `src/index.ts`

### "Redirect URI Mismatch"
- Check Facebook app settings → Facebook Login → Valid OAuth Redirect URIs
- Make sure `FACEBOOK_CALLBACK_URL` in `.env` matches exactly

### "App Not Setup: This app is still in development mode"
- Add test users in Facebook App → Roles → Test Users
- Or submit app for review to make it public

### "Invalid App ID"
- Verify `FACEBOOK_APP_ID` in `.env` is correct
- No spaces or extra characters

---

## 📝 Next Steps

1. ✅ Backend implementation complete
2. ⏳ Set up Facebook App on Facebook Developers
3. ⏳ Update `.env` with Facebook credentials
4. ⏳ Test the login flow
5. ⏳ For production: Submit app for Facebook review (if needed)

---

## 🔗 Useful Links

- [Facebook for Developers](https://developers.facebook.com/)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Passport Facebook Strategy](http://www.passportjs.org/packages/passport-facebook/)
