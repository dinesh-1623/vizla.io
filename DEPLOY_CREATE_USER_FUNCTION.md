# 🚀 Deploy Create-User Edge Function

## The Problem
The Edge Function `create-user` returns 404 because it hasn't been deployed yet.

## Solution: Deploy via Supabase Dashboard

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **Vizla** (dinesh-1623's Project)

### Step 2: Navigate to Edge Functions
1. Click **Edge Functions** in the left sidebar
2. You should see a list of functions (or empty if none exist)

### Step 3: Create New Function
1. Click **"Create a new function"** button (or **"New Function"**)
2. Function name: `create-user` (exactly this name, lowercase with hyphen)
3. Click **"Create function"**

### Step 4: Paste the Code
1. Delete any default code in the editor
2. Open the file: `supabase/functions/create-user/index.ts`
3. Copy **ALL** the code from that file
4. Paste it into the Supabase function editor

### Step 5: Deploy
1. Click **"Deploy"** button (usually top right)
2. Wait for deployment to complete (you'll see "Deployed successfully")

### Step 6: Test
1. Go back to your app (User Management page)
2. Refresh the browser
3. Try creating a user again
4. It should work now! ✅

## Alternative: Deploy via CLI

If you have Supabase CLI installed:

```bash
cd /Users/dineshmotati/Downloads/driver-dash-view-main-2

# Login to Supabase (if not already)
supabase login

# Link to your project (if not already)
supabase link --project-ref leufayhtfxjwhxwtsmyq

# Deploy the function
supabase functions deploy create-user
```

## What This Function Does

The `create-user` Edge Function:
1. ✅ Creates an auth user in `auth.users`
2. ✅ Creates a profile in `profiles` table with the same ID
3. ✅ Handles all the foreign key constraints properly
4. ✅ Returns a temporary password (auto-generated)
5. ✅ Handles errors gracefully

## After Deployment

Once deployed, you'll be able to:
- ✅ Create users from the User Management page
- ✅ Users will have both auth account and profile
- ✅ Temporary passwords will be shown in success message

## Troubleshooting

**If you get "Function not found":**
- Make sure the function name is exactly `create-user` (lowercase, with hyphen)
- Check that deployment completed successfully

**If you get permission errors:**
- The function uses `SUPABASE_SERVICE_ROLE_KEY` which is automatically available
- No additional setup needed

**If deployment fails:**
- Check the Supabase Dashboard → Edge Functions → Logs
- Look for any error messages


