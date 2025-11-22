# 🔧 Fix 404 Error: Deploy Edge Function

## ❌ Current Problem

You're seeing this error:
```
Preflight response is not successful. Status code: 404
Failed to send a request to the Edge Function
```

**Cause:** The Edge Function `ai-optimize-driver-routes` is **not deployed** to Supabase.

---

## ✅ Solution: Deploy via Supabase Dashboard (Easiest)

### Step 1: Open Supabase Dashboard

1. Go to: **https://app.supabase.com/project/leufayhtfxjwhxwtsmyq**
2. Click **"Edge Functions"** in the left sidebar

### Step 2: Create New Function

1. Click **"Create a new function"** button
2. Function name: `ai-optimize-driver-routes`
3. Click **"Create function"**

### Step 3: Copy Function Code

1. Open the file: `supabase/functions/ai-optimize-driver-routes/index.ts`
2. **Select All** (Ctrl+A or Cmd+A)
3. **Copy** (Ctrl+C or Cmd+C)
4. **Paste** into the Supabase Dashboard code editor
5. Click **"Deploy"** button

### Step 4: Set OpenAI API Key Secret

1. In the Edge Function page, click **"Secrets"** tab
2. Click **"Add secret"**
3. Name: `OPENAI_API_KEY`
4. Value: `your_openai_api_key_here`
5. Click **"Save"**

### Step 5: Test the Function

1. Go back to your app: `/app/driver/progress`
2. Click **"AI Optimize"** button
3. Should work now! ✅

---

## ✅ Alternative: Deploy via CLI (If Dashboard Doesn't Work)

### Step 1: Login to Supabase

```bash
supabase login
```

This opens a browser for authentication.

### Step 2: Link Project

```bash
cd /Users/dineshmotati/Downloads/driver-dash-view-main-2
supabase link --project-ref leufayhtfxjwhxwtsmyq
```

**If you get permission error:**
- Make sure you're logged in as the project owner
- Or use the Dashboard method above

### Step 3: Deploy Function

```bash
supabase functions deploy ai-optimize-driver-routes
```

### Step 4: Set Secret

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

---

## 📝 Quick Checklist

- [ ] Edge Function created in Supabase Dashboard
- [ ] Function code pasted from `supabase/functions/ai-optimize-driver-routes/index.ts`
- [ ] Function deployed
- [ ] OpenAI API key set as secret
- [ ] Tested "AI Optimize" button - works! ✅

---

## 🔍 Verify Deployment

After deploying, verify:

1. **Check function exists:**
   - Go to Supabase Dashboard → Edge Functions
   - Should see `ai-optimize-driver-routes` in the list

2. **Test from app:**
   - Go to `/app/driver/progress`
   - Click "AI Optimize"
   - Should see optimization results (no 404 error)

3. **Check function logs:**
   - In Supabase Dashboard → Edge Functions → `ai-optimize-driver-routes`
   - Click "Logs" tab
   - Should see requests when you click "AI Optimize"

---

## 🎯 What to Do Right Now

**Recommended: Use Supabase Dashboard**

1. **Go to:** https://app.supabase.com/project/leufayhtfxjwhxwtsmyq/functions
2. **Create function:** `ai-optimize-driver-routes`
3. **Paste code** from `supabase/functions/ai-optimize-driver-routes/index.ts`
4. **Deploy**
5. **Set secret:** `OPENAI_API_KEY`
6. **Test** from your app

---

## ✅ Success!

After deployment, the "AI Optimize" button will work and you'll see:
- ✅ No 404 errors
- ✅ Optimization results appear
- ✅ AI insights displayed on route cards

**The Edge Function is ready to deploy!** 🚀




