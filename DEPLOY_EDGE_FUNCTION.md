# 🚀 Deploy AI Optimize Driver Routes Edge Function

## ❌ Current Issue

The Edge Function `ai-optimize-driver-routes` is **not deployed**, causing a 404 error when you click "AI Optimize".

**Error:** `Preflight response is not successful. Status code: 404`

---

## ✅ Solution: Deploy the Edge Function

### Step 1: Install Supabase CLI (if not installed)

```bash
# Check if Supabase CLI is installed
which supabase

# If not installed, install it:
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

### Step 3: Link Your Project

```bash
# Link to your Supabase project
supabase link --project-ref leufayhtfxjwhxwtsmyq
```

**Note:** Replace `leufayhtfxjwhxwtsmyq` with your actual project reference if different.

### Step 4: Deploy the Edge Function

```bash
# Deploy the AI optimize driver routes function
supabase functions deploy ai-optimize-driver-routes
```

**Expected output:**
```
Deploying function ai-optimize-driver-routes...
Function deployed successfully!
```

### Step 5: Set OpenAI API Key Secret

The Edge Function needs your OpenAI API key:

```bash
# Set the OpenAI API key as a secret
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

**Or set it in Supabase Dashboard:**
1. Go to: **Supabase Dashboard** → **Edge Functions** → **Secrets**
2. Add: `OPENAI_API_KEY` = `your-openai-api-key`
3. Click **Save**

---

## ✅ Verify Deployment

### Test the Function

After deployment, test it from the Driver Progress page:

1. Go to: `/app/driver/progress`
2. Click **"AI Optimize"** button
3. Should see optimization results (no more 404 error)

### Check Function Logs

```bash
# View function logs
supabase functions logs ai-optimize-driver-routes
```

---

## 🔍 Troubleshooting

### Error: "Function not found"
**Fix:** Make sure you're in the project root directory and the function exists at `supabase/functions/ai-optimize-driver-routes/index.ts`

### Error: "Authentication failed"
**Fix:** Run `supabase login` again

### Error: "Project not linked"
**Fix:** Run `supabase link --project-ref YOUR_PROJECT_REF`

### Still getting 404 after deployment
**Fix:** 
1. Wait 30 seconds for deployment to propagate
2. Clear browser cache
3. Check function logs: `supabase functions logs ai-optimize-driver-routes`

---

## 📝 Quick Deploy Command

**One-liner to deploy everything:**

```bash
# Login (if not already)
supabase login

# Link project (if not already)
supabase link --project-ref leufayhtfxjwhxwtsmyq

# Deploy function
supabase functions deploy ai-optimize-driver-routes

# Set OpenAI key (if not already set)
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Edge Function deployed successfully
- [ ] OpenAI API key set as secret
- [ ] No 404 errors in browser console
- [ ] "AI Optimize" button works
- [ ] Optimization results appear

---

## 🎯 Next Steps

After successful deployment:

1. **Test the feature** on Driver Progress page
2. **Check optimization results** in the UI
3. **Monitor function logs** for any errors
4. **Review AI costs** in OpenAI dashboard

---

**The Edge Function is ready to deploy!** 🚀




