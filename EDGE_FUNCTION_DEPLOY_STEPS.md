# Deploy Edge Function - Step by Step

## Using Supabase Dashboard Editor

### Step 1: Open Editor
1. On the Edge Functions page, click **"Open Editor"** under "Via Editor"
2. This opens the function editor

### Step 2: Create New Function
1. In the editor, look for **"New Function"** or **"+"** button
2. Or use the dropdown if you see existing functions
3. Function name: `ai-extract-note-metadata`

### Step 3: Copy Function Code
1. Open file: `supabase/functions/ai-extract-note-metadata/index.ts`
2. **Select All** (Cmd+A / Ctrl+A)
3. **Copy** (Cmd+C / Ctrl+C)

### Step 4: Paste & Deploy
1. **Paste** code into the editor (Cmd+V / Ctrl+V)
2. Click **"Deploy"** or **"Save"** button
3. Wait for deployment to complete ✅

### Step 5: Verify
1. Function should appear in your Edge Functions list
2. Status should be **"Active"**
3. You can click on it to see details/logs

---

## Alternative: Using CLI (If Editor Doesn't Work)

If the editor method doesn't work, try CLI:

```bash
cd /Users/dineshmotati/Downloads/driver-dash-view-main-2

# Login first (will open browser)
supabase login

# Link project
supabase link --project-ref leufayhtfxjwhxwtsmyq

# Deploy function
supabase functions deploy ai-extract-note-metadata
```

---

## After Deployment

1. ✅ Function should be listed in Edge Functions
2. ✅ Status: Active
3. ✅ Test by clicking "Extract Metadata" in your app
4. ✅ Should work without 404 errors!

