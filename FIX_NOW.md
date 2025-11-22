# 🔧 Fix AI Metadata Extraction - Step by Step

Based on the console errors, you need to fix two things:

---

## ❌ Issue 1: Database Migration Not Applied

**Error:** `404 - vehicle_extracted_metadata table not found`

**Fix:** Apply the migration in Supabase Dashboard

### Steps:

1. **Open Supabase SQL Editor:**
   - Go to: https://app.supabase.com/project/leufayhtfxjwhxwtsmyq/editor
   - Click **"SQL Editor"** in left sidebar
   - Click **"New Query"** button

2. **Copy Migration SQL:**
   - Open file: `supabase/migrations/010_ai_metadata.sql` in your code editor
   - **Select All** (Cmd+A / Ctrl+A)
   - **Copy** (Cmd+C / Ctrl+C)

3. **Paste & Run:**
   - **Paste** into Supabase SQL Editor (Cmd+V / Ctrl+V)
   - Click **"Run"** button (or press Cmd+Enter / Ctrl+Enter)
   - Wait for **"Success"** message ✅

4. **Verify Tables Created:**
   - Click **"Table Editor"** in left sidebar
   - You should see:
     - ✅ `vehicle_extracted_metadata`
     - ✅ `ai_processing_logs`
   - Check `located_vehicles` table → should have:
     - ✅ `metadata_extracted_at` column
     - ✅ `metadata_extraction_status` column

---

## ❌ Issue 2: Edge Function Not Deployed

**Error:** `404 - ai-extract-note-metadata function not found`

**Fix:** Deploy the Edge Function

### Option A: Using Supabase Dashboard (Easier)

1. **Go to Edge Functions:**
   - https://app.supabase.com/project/leufayhtfxjwhxwtsmyq/functions
   - Click **"Edge Functions"** in left sidebar

2. **Check if function exists:**
   - Look for `ai-extract-note-metadata`
   - If it exists, skip to Option B (verify it's working)
   - If it doesn't exist, continue with CLI deployment (Option B)

### Option B: Using Supabase CLI (Recommended)

1. **Open Terminal:**
   - Navigate to your project directory:
   ```bash
   cd /Users/dineshmotati/Downloads/driver-dash-view-main-2
   ```

2. **Link Your Project (if not already linked):**
   ```bash
   supabase link --project-ref leufayhtfxjwhxwtsmyq
   ```
   - Follow prompts to authenticate

3. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy ai-extract-note-metadata
   ```
   - Wait for deployment to complete ✅

4. **Verify Deployment:**
   - Go to Supabase Dashboard → Edge Functions
   - You should see `ai-extract-note-metadata` listed
   - Status should be **"Active"**

---

## ✅ After Both Fixes - Test

1. **Refresh Your App:**
   - Close and reopen the browser tab
   - Or hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

2. **Test Extraction:**
   - Go to Blocked Vehicles page
   - Click **"View Details"** on any vehicle
   - Click **"Extract Metadata"** button
   - Should work without errors! ✅

3. **Verify:**
   - No 404 errors in console
   - Button shows loading spinner
   - Success message appears
   - Metadata card populates with data

---

## 🐛 Troubleshooting

### Still seeing 404 for table?
- **Double-check:** Did migration run successfully?
- **Verify:** Go to Table Editor → Do you see `vehicle_extracted_metadata`?
- **Try again:** Re-run the migration SQL

### Still seeing 404 for function?
- **Check:** Is function listed in Edge Functions?
- **Verify:** Is it deployed and active?
- **Try:** Redeploy the function using CLI

### Button still shows error?
- **Clear browser cache:** Hard refresh (Cmd+Shift+R)
- **Check console:** Are there any new errors?
- **Verify secrets:** Is OpenAI API key still set in Supabase?

---

## 🎯 Quick Checklist

After completing both fixes:

- [ ] Migration applied (tables exist)
- [ ] Edge Function deployed (function exists)
- [ ] OpenAI API key set (already done ✅)
- [ ] No 404 errors in console
- [ ] "Extract Metadata" button works
- [ ] Metadata extraction completes
- [ ] Metadata displays in card

---

## 📋 Quick Command Reference

```bash
# Navigate to project
cd /Users/dineshmotati/Downloads/driver-dash-view-main-2

# Link project (if needed)
supabase link --project-ref leufayhtfxjwhxwtsmyq

# Deploy Edge Function
supabase functions deploy ai-extract-note-metadata

# Check status
supabase functions list
```

---

## 🚀 Once Complete

You should be able to:
- ✅ Click "Extract Metadata" on any vehicle
- ✅ See loading spinner
- ✅ Get success message
- ✅ View extracted metadata in card
- ✅ See parking type, gate code, fees, accessibility score, etc.

**You're almost there! Just apply the migration and deploy the function!** 🎉

