# Netlify Deployment Guide for Vizla Dashboard

This guide will help you deploy your Vizla Dashboard application to Netlify.

## ✅ Pre-Deployment Checklist

Your project is already configured for Netlify deployment with:
- ✅ `netlify.toml` configuration file
- ✅ `public/_redirects` for SPA routing
- ✅ Build command configured (`npm run build`)
- ✅ Publish directory set (`dist`)
- ✅ SPA redirect rules configured
- ✅ Security headers configured
- ✅ Asset caching optimized

## 🚀 Deployment Options

### Option 1: Deploy via Netlify UI (Recommended for First-Time)

1. **Sign up / Log in to Netlify**
   - Go to [https://app.netlify.com](https://app.netlify.com)
   - Sign in with GitHub, GitLab, or Bitbucket

2. **Add a New Site**
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your repository

3. **Configure Build Settings** (Auto-detected, but verify):
   ```
   Build command: npm run build
   Publish directory: dist
   Node version: 20 (or latest LTS)
   ```

4. **Set Environment Variables** (Optional)
   - Go to Site settings → Build & deploy → Environment
   - Add any required variables:
     ```
     VITE_API_BASE=https://your-api-url.com (if using API)
     ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for the build to complete

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize Site** (first time only):
   ```bash
   netlify init
   ```
   
   This will:
   - Link your local project to a Netlify site
   - Create a `.netlify` folder with site configuration
   - Set up continuous deployment

4. **Deploy to Production**:
   ```bash
   npm run build
   netlify deploy --prod
   ```

5. **Deploy a Preview**:
   ```bash
   netlify deploy
   ```

### Option 3: Deploy via GitHub Actions (CI/CD)

If you want automated deployments on every push:

1. **Create `.github/workflows/netlify.yml`**:
   ```yaml
   name: Deploy to Netlify
   on:
     push:
       branches: [ main, master ]
     pull_request:
       branches: [ main, master ]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '20'
         - run: npm ci
         - run: npm run build
         - uses: netlify/actions/cli@master
           with:
             args: deploy --prod --dir=dist
           env:
             NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
             NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
   ```

2. **Add Secrets to GitHub**:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add `NETLIFY_AUTH_TOKEN` (get from Netlify → User settings → Applications)
   - Add `NETLIFY_SITE_ID` (get from Site settings → General)

## 📋 Build Configuration

Your `netlify.toml` is configured with:

- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: `20`
- **SPA Redirects**: All routes redirect to `/index.html` for React Router
- **Cache Headers**: Optimized for assets and images
- **Security Headers**: X-Frame-Options, CSP, etc.

## 🔧 Environment Variables (Optional)

The app works without environment variables (uses mock data), but you can configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE` | Backend API URL | No (falls back to mock data) |

**To add environment variables:**
1. Go to Netlify Dashboard → Site settings → Environment variables
2. Add variables for Production, Deploy previews, or Branch deploys

## 🌐 Custom Domain Setup

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow Netlify's DNS setup instructions
4. Netlify will automatically provision SSL certificate

## 🔄 Continuous Deployment

Once connected to Git:
- **Automatic deploys**: Every push to main/master branch
- **Deploy previews**: Every pull request gets a preview URL
- **Branch deploys**: Deploy specific branches for testing

## 📊 Monitoring & Analytics

1. **Build Logs**: View in Netlify Dashboard → Deploys
2. **Function Logs**: If using Netlify Functions
3. **Analytics**: Enable in Site settings → Analytics
4. **Performance**: Check Lighthouse scores (plugin already configured)

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Netlify Dashboard
- Verify Node version matches (20.x)
- Ensure all dependencies are in `package.json` (not just devDependencies)
- Check for TypeScript errors: `npm run lint`

### 404 Errors on Routes
- Verify `public/_redirects` exists with `/* /index.html 200`
- Check `netlify.toml` redirect rules

### Assets Not Loading
- Verify paths use relative URLs (`/images/...` not `./images/...`)
- Check that public assets are in `public/` folder

### Environment Variables Not Working
- Ensure variables start with `VITE_` for Vite to expose them
- Redeploy after adding/changing environment variables
- Check variable names match exactly (case-sensitive)

## 🚀 Quick Deploy Commands

```bash
# Build locally to test
npm run build

# Preview build locally
npm run preview

# Deploy to Netlify (production)
netlify deploy --prod

# Deploy preview
netlify deploy

# View site status
netlify status

# Open site in browser
netlify open:site
```

## 📝 Post-Deployment Checklist

After deployment:
- [ ] Verify site loads correctly
- [ ] Test all routes (no 404 errors)
- [ ] Test theme toggle (dark/light mode)
- [ ] Verify images and assets load
- [ ] Test responsive design on mobile
- [ ] Check browser console for errors
- [ ] Verify logo displays correctly
- [ ] Test all major features

## 🎯 Performance Optimization

Already configured:
- ✅ Code splitting (Vite)
- ✅ Asset compression
- ✅ Cache headers for static assets
- ✅ Gzip compression (automatic)
- ✅ Image optimization (if enabled)

Consider adding:
- Image CDN (Cloudinary, Imgix)
- Bundle analysis (`npm run build -- --analyze`)
- Lazy loading for images
- Service worker for offline support

## 📞 Support

- Netlify Docs: https://docs.netlify.com
- Netlify Status: https://www.netlifystatus.com
- Community: https://community.netlify.com

---

**Your site will be live at**: `https://your-site-name.netlify.app`

Happy deploying! 🚀


