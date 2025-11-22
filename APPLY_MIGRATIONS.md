# 🚀 Deploy Supabase Migrations - Step by Step

## Quick Steps to Apply Migrations

Your `master.sql` file is ready with 819 lines of SQL code.

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**:
   - Go to: https://app.supabase.com/project/leufayhtfxjwhxwtsmyq/editor

2. **Open SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query" button

3. **Paste Migration**:
   - Open `supabase/migrations/master.sql` in your editor
   - Copy all contents (Ctrl+A, Ctrl+C or Cmd+A, Cmd+C)
   - Paste in Supabase SQL Editor

4. **Run Migration**:
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for "Success" message (may take 10-30 seconds)

5. **Verify**:
   - Go to "Table Editor" in left sidebar
   - You should see 10 tables created:
     - profiles
     - markets
     - zones
     - clients
     - storage_lots
     - fleet_vehicles
     - located_vehicles
     - drivers
     - shifts
     - assignments
     - spotter_submissions

### Option 2: Check Line-by-Line (If Errors Occur)

If you get errors, you can paste each migration file separately in order:
1. `001_enums.sql`
2. `002_auth_profiles.sql`
3. `003_dimensions.sql`
4. `004_vehicles.sql`
5. `005_personnel.sql`
6. `006_assignments.sql`
7. `007_views.sql`
8. `008_functions.sql`

## What to Expect

**Success Output**:
```
Success. No rows returned
```

**If you see errors**, they're usually:
- Tables already exist (safe to ignore if re-running)
- Missing dependencies (run migrations in order)
- Permission issues (check RLS policies)

## After Migrations

Once migrations are complete:
1. ✅ Tables created
2. ✅ Views created
3. ✅ Functions created
4. ✅ RLS policies enabled

**Next Step**: Run the seed script!

---

**Ready?** Copy the master.sql contents and paste into Supabase SQL Editor!


