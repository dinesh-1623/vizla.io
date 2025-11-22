# AI Metadata Extraction - Setup Guide

## 🔧 Quick Fix for "Table Not Found" Error

The error `"Could not find the table 'public.vehicle_extracted_metadata'"` means the migration hasn't been applied yet. Follow these steps:

---

## Step 1: Apply Database Migration (Required)

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Supabase SQL Editor:**
   - Open your Supabase project: https://app.supabase.com
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New Query"** button

2. **Open the Migration File:**
   - Open: `supabase/migrations/010_ai_metadata.sql`
   - Select All (Ctrl+A or Cmd+A)
   - Copy (Ctrl+C or Cmd+C)

3. **Run Migration:**
   - Paste into Supabase SQL Editor (Ctrl+V)
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for **"Success"** message ✅

4. **Verify Tables Created:**
   - Click **"Table Editor"** in left sidebar
   - You should see these new tables:
     - ✅ `vehicle_extracted_metadata`
     - ✅ `ai_processing_logs`
   - Check that `located_vehicles` has these new columns:
     - ✅ `metadata_extracted_at`
     - ✅ `metadata_extraction_status`

### Option B: Using Supabase CLI (If You Have It Installed)

```bash
# Make sure you're in the project root
cd /path/to/your/project

# Apply migration
supabase db push

# Or link to your project first
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

---

## Step 2: Set OpenAI API Key for Edge Function (Required)

### Get Your OpenAI API Key

1. **Get API Key from OpenAI:**
   - Go to: https://platform.openai.com/api-keys
   - Sign in to your OpenAI account
   - Click **"Create new secret key"**
   - Copy the key (starts with `sk-...`)
   - ⚠️ **Save it now** - you won't be able to see it again!

### Add to Supabase Edge Function Secrets

1. **Go to Supabase Dashboard:**
   - Open your project: https://app.supabase.com
   - Click **"Edge Functions"** in the left sidebar
   - Click **"Secrets"** tab (or go to Settings → Edge Functions → Secrets)

2. **Add OpenAI API Key:**
   - Click **"Add Secret"** or **"New Secret"**
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Paste your OpenAI API key (the `sk-...` key you copied)
   - Click **"Save"** ✅

   **OR** using Supabase CLI:

   ```bash
   # Set secret
   supabase secrets set OPENAI_API_KEY=sk-your-key-here

   # Deploy Edge Function (if not already deployed)
   supabase functions deploy ai-extract-note-metadata
   ```

---

## Step 3: Deploy Edge Function (If Not Already Deployed)

### Option A: Using Supabase Dashboard

1. **Go to Edge Functions:**
   - Click **"Edge Functions"** in left sidebar
   - Check if `ai-extract-note-metadata` exists

2. **If it doesn't exist, deploy using CLI:**

   ```bash
   # Deploy Edge Function
   supabase functions deploy ai-extract-note-metadata
   ```

### Option B: Using Supabase CLI

```bash
# Make sure you're in the project root
cd /path/to/your/project

# Link to your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy ai-extract-note-metadata

# Set the secret
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

---

## Step 4: Test the Integration

1. **Open Your App:**
   - Go to the Blocked Vehicles page
   - Click **"View Details"** on any vehicle

2. **Check Metadata Card:**
   - You should see "AI-Extracted Metadata" card
   - It should show "No metadata extracted yet" (no error!)

3. **Click "Extract Metadata" Button:**
   - Button should show loading spinner
   - Wait 2-5 seconds
   - Should show success message with extracted metadata ✅

4. **Verify Metadata:**
   - Card should show:
     - Parking Type
     - Gate Code (if mentioned)
     - Damage Description (if mentioned)
     - Special Instructions
     - Estimated Fees (if mentioned)
     - Accessibility Score (1-10)

---

## 🐛 Troubleshooting

### Error: "Could not find the table"
**Fix:** Step 1 not completed. Apply the migration first.

### Error: "OPENAI_API_KEY environment variable is not set"
**Fix:** Step 2 not completed. Add the secret in Supabase Dashboard.

### Error: "Function not found" or 404
**Fix:** Step 3 not completed. Deploy the Edge Function.

### Error: "Permission denied" when fetching metadata
**Fix:** Check RLS policies. The migration should have set them, but verify:
   - Go to Supabase → Table Editor → `vehicle_extracted_metadata`
   - Click "Policies" tab
   - Should see policies allowing SELECT for anon users

### Button shows "Loading" forever
**Fix:** Check browser console for errors. Likely:
   - Edge Function not deployed
   - OpenAI API key invalid
   - Network/CORS issue

### Metadata not showing after extraction
**Fix:** Check Edge Function logs:
   - Go to Supabase → Edge Functions → `ai-extract-note-metadata`
   - Click "Logs" tab
   - Look for errors

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Migration applied successfully (tables exist)
- [ ] OpenAI API key set in Edge Function secrets
- [ ] Edge Function deployed
- [ ] No errors in browser console
- [ ] "Extract Metadata" button appears
- [ ] Button click shows loading spinner
- [ ] Success message appears after extraction
- [ ] Metadata card displays extracted data

---

## 📊 Expected Results

### After Migration:
- ✅ `vehicle_extracted_metadata` table exists
- ✅ `ai_processing_logs` table exists
- ✅ `located_vehicles` has new columns

### After Setting API Key:
- ✅ Edge Function can access OpenAI API
- ✅ Extraction requests succeed

### After Testing:
- ✅ Button extracts metadata successfully
- ✅ Metadata displays in card
- ✅ All fields populate correctly

---

## 🎉 You're Done!

Once all steps are complete, the AI metadata extraction feature should work perfectly. Users can click "Extract Metadata" on any vehicle with notes, and structured metadata will be extracted and displayed automatically!

