# 🚀 Apply Migration 017: Companies Table

## Step-by-Step Instructions

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project: https://supabase.com/dashboard
   - Select your VIZLA project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration Content**
   - Open the file: `supabase/migrations/017_multi_tenancy_companies.sql`
   - Copy ALL the content (Ctrl+A, Ctrl+C / Cmd+A, Cmd+C)

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click "Run" button (or press Ctrl+Enter / Cmd+Enter)

5. **Verify Success**
   - You should see: "Success. No rows returned" or similar
   - Check for any errors in red

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
cd /Users/dineshmotati/Downloads/driver-dash-view-main-2
supabase db push
```

This will apply all pending migrations.

---

## What This Migration Creates

✅ **Companies Table** - Master table for all tenant companies
- Fields: id, name, slug, email, status, plan, logo_url, primary_color, settings, etc.
- Indexes for performance
- RLS policies for security

✅ **Helper Functions**
- `generate_company_slug()` - Auto-generates URL-safe slugs from company names
- `update_companies_updated_at()` - Auto-updates timestamp on changes

✅ **RLS Policies**
- Users can view their own company
- Super admins can manage all companies
- Company admins can update their own company

---

## After Running Migration

1. **Verify it worked:**
   ```sql
   -- Check if companies table exists
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'companies';
   
   -- Should return 1 row
   ```

2. **Test the slug function:**
   ```sql
   SELECT generate_company_slug('Ace Recovery Services');
   -- Should return: 'ace-recovery-services'
   ```

3. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'companies';
   
   -- rowsecurity should be: true
   ```

---

## Troubleshooting

### Error: "relation already exists"
- The table already exists - migration may have been partially applied
- Check if you can skip to next migration

### Error: "permission denied"
- Make sure you're using the SQL Editor (has full permissions)
- Or use service role key if using API

### Error: "function already exists"
- The function was created before
- This is OK - the migration uses `CREATE OR REPLACE`

---

## Next Steps

After migration 017 succeeds:
1. ✅ Run `CHECK_MIGRATION_STATUS.sql` again to verify
2. ➡️ Apply migration 018: `018_multi_tenancy_users_update.sql`
3. ➡️ Continue with migrations 019-022

---

## Need Help?

If you encounter errors:
1. Copy the full error message
2. Check Supabase logs (Dashboard → Logs)
3. Verify you have the correct permissions
4. Make sure you're in the right project/database


