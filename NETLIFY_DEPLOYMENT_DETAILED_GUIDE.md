# 🚀 Detailed Netlify Deployment Guide

## 📋 Overview
Deploy your multi-tenant, AI-powered tow truck application to Netlify with proper environment variables and configuration.

## 🎯 Why Netlify Over Vercel?
- ✅ **Better SPA Support**: Already configured in `netlify.toml`
- ✅ **No Redirect Issues**: Handles client-side routing perfectly
- ✅ **Reliable Deployment**: Proven track record with React apps
- ✅ **Easy Environment Variables**: Simple dashboard setup

---

## 📝 Step 1: Access Netlify

### 1.1 Go to Netlify
- **URL**: https://app.netlify.com/start
- **Action**: Click "New site from Git"

### 1.2 Sign Up/Login
- **Options**: GitHub, GitLab, Bitbucket, or Email
- **Recommended**: Use GitHub (same account as your repo)

---

## 🔗 Step 2: Connect Your Repository

### 2.1 Choose Git Provider
- Click **"GitHub"** (since your code is on GitHub)
- **Authorize Netlify** to access your GitHub account

### 2.2 Select Repository
- **Search for**: `vizla.io` or `dinesh-1623/vizla.io`
- **Repository URL**: https://github.com/dinesh-1623/vizla.io
- **Click**: "Deploy site" or "Configure"

### 2.3 Repository Permissions
- If you don't see your repo, click **"Configure Netlify on GitHub"**
- **Grant access** to the `vizla.io` repository

---

## ⚙️ Step 3: Configure Build Settings

### 3.1 Basic Settings
```
Site name: tow-truck-illinois (or your preferred name)
Branch to deploy: main
```

### 3.2 Build Settings
```
Build command: npm run build
Publish directory: dist
```

### 3.3 Advanced Settings (Optional)
```
Node version: 20
Package manager: npm
```

---

## 🔑 Step 4: Add Environment Variables

### 4.1 Access Environment Variables
- **After deployment**: Go to Site Settings → Environment Variables
- **Or during setup**: Click "Show advanced" → "New variable"

### 4.2 Add These Variables (Copy Exactly)

#### Supabase Configuration
```
Variable name: VITE_SUPABASE_URL
Value: https://leufayhtfxjwhxwtsmyq.supabase.co
```

```
Variable name: VITE_SUPABASE_ANON_KEY
Value: [Your Supabase Anon Key - get from your .env file]
```

#### Google Maps API
```
Variable name: VITE_GOOGLE_MAPS_KEY
Value: AIzaSyANCh9pASt1dZplRwC-C9iTUCXZ-d4ptKo
```

#### OpenAI API (for AI features)
```
Variable name: VITE_OPENAI_API_KEY
Value: [Your OpenAI API Key - get from your .env file]
```

#### Feature Flags
```
Variable name: VITE_ENABLE_AI_ALERT_PRIORITIZATION
Value: true
```

### 4.3 Service Role Key (Optional - for admin functions)
```
Variable name: VITE_SUPABASE_SERVICE_ROLE_KEY
Value: [Your Supabase Service Role Key - get from your .env file]
```

---

## 🚀 Step 5: Deploy

### 5.1 Initial Deployment
- **Click**: "Deploy site" (if not done automatically)
- **Wait**: 2-5 minutes for build to complete
- **Status**: Watch the deploy log for any errors

### 5.2 Build Process
You'll see:
```
Installing dependencies...
Running build command: npm run build
Publishing directory: dist
Deploy successful!
```

### 5.3 Get Your URL
- **Format**: `https://[random-name].netlify.app`
- **Example**: `https://tow-truck-illinois.netlify.app`
- **Custom domain**: Available in Site Settings

---

## 🧪 Step 6: Test Your Deployment

### 6.1 Test URLs
```
Landing Page: https://[your-site].netlify.app/
Auth Page: https://[your-site].netlify.app/auth
Tow Driver: https://[your-site].netlify.app/app/tow-driver
```

### 6.2 What Should Work
- ✅ **Landing page** loads without login
- ✅ **Auth page** shows your login form (not Netlify's)
- ✅ **Create account** functionality works
- ✅ **Illinois lots** appear in tow driver view
- ✅ **AI features** respond (chat, optimization)
- ✅ **Google Maps** shows directions

### 6.3 Test Account Creation
1. Go to `/auth`
2. Click "Sign Up" or "Create Account"
3. Use: `test@example.com` / `password123`
4. Should redirect to dashboard after signup

---

## 🔧 Step 7: Troubleshooting

### 7.1 Build Failures
**Common issues:**
- **Node version**: Set to 20 in Site Settings
- **Environment variables**: Double-check all values
- **Build command**: Ensure it's `npm run build`

### 7.2 Runtime Errors
**Check browser console for:**
- **API key errors**: Verify environment variables
- **CORS errors**: Should be resolved with Netlify
- **Supabase errors**: Check database connection

### 7.3 Routing Issues
**If pages don't load:**
- Netlify should handle this automatically with `netlify.toml`
- Check Site Settings → Build & Deploy → Post processing

---

## 🎯 Step 8: Custom Domain (Optional)

### 8.1 Add Custom Domain
- **Go to**: Site Settings → Domain management
- **Add**: Your custom domain (e.g., `towtrucks-illinois.com`)
- **Configure DNS**: Point to Netlify's servers

### 8.2 SSL Certificate
- **Automatic**: Netlify provides free SSL
- **Status**: Check in Domain settings

---

## 📊 Step 9: Monitor & Maintain

### 9.1 Analytics
- **Built-in**: Netlify Analytics (paid feature)
- **Free options**: Google Analytics, Plausible

### 9.2 Continuous Deployment
- **Automatic**: Deploys on every GitHub push to `main`
- **Manual**: Trigger deploys from Netlify dashboard

### 9.3 Environment Management
- **Staging**: Create branch deploys for testing
- **Production**: Main branch for live site

---

## ✅ Success Checklist

### Deployment Complete When:
- [ ] Site builds successfully
- [ ] All environment variables added
- [ ] Landing page loads
- [ ] Auth page shows login form
- [ ] Can create test accounts
- [ ] Tow driver page shows Illinois lots
- [ ] AI features work (chat, optimization)
- [ ] Google Maps integration works
- [ ] Mobile responsive

### Illinois Tow Truck Features Working:
- [ ] **Multi-tenant**: Companies can create portals
- [ ] **User roles**: Spotters, drivers, managers
- [ ] **Illinois lots**: Calumet Park, Melrose Park, Joliet
- [ ] **Nearest lot finder**: AI-powered selection
- [ ] **Route optimization**: Efficient pickup sequences
- [ ] **Return-to-lot**: Clean workflow (no stash options)

---

## 🎉 Final Result

**Your multi-tenant, AI-powered tow truck application will be live at:**
`https://[your-site-name].netlify.app`

**Ready for Illinois tow truck companies to:**
- ✅ Create company portals
- ✅ Add team members
- ✅ Use AI route optimization
- ✅ Return vehicles to nearest lots
- ✅ Scale their operations

---

## 🆘 Need Help?

### Common Commands
```bash
# Test locally first
npm run dev

# Build locally to test
npm run build
npm run preview

# Check environment variables
echo $VITE_SUPABASE_URL
```

### Support Resources
- **Netlify Docs**: https://docs.netlify.com/
- **Netlify Support**: https://answers.netlify.com/
- **Your GitHub Repo**: https://github.com/dinesh-1623/vizla.io

**Your professional tow truck application is ready for deployment!** 🚛✨
