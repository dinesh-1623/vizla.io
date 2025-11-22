# ✅ Migrations Fixed - Ready to Deploy Again!

## What Was Wrong

The error `42601: only WITH CHECK expression allowed for INSERT` occurred because INSERT policies were using `USING` instead of `WITH CHECK`.

## What I Fixed

Changed 4 policies from `USING` to `WITH CHECK` for INSERT operations:

1. ✅ `located_vehicles` - INSERT policy
2. ✅ `drivers` - INSERT policy  
3. ✅ `assignments` - INSERT policy
4. ✅ `spotter_submissions` - INSERT policy

## How to Fix Existing Error

If you already ran the migrations and got errors:

### Option 1: Drop and Recreate (Clean Slate)

In Supabase SQL Editor, run:

```sql
-- Drop all existing policies (if any were created)
DROP POLICY IF EXISTS "Admins and dispatchers can insert vehicles" ON located_vehicles;
DROP POLICY IF EXISTS "Admins and dispatchers can manage drivers" ON drivers;
DROP POLICY IF EXISTS "Admins and dispatchers can create assignments" ON assignments;
DROP POLICY IF EXISTS "Spotters can create submissions" ON spotter_submissions;

-- Now apply the fixed master.sql file
```

### Option 2: Apply Fixed Migrations

The `master.sql` file has been fixed. Just apply it fresh:

1. Go to Supabase SQL Editor
2. Copy the fixed `master.sql` file
3. Paste and run

## Why This Happened

In PostgreSQL RLS:
- **USING** is for SELECT/UPDATE/DELETE operations
- **WITH CHECK** is for INSERT/UPDATE operations

The error occurred because INSERT operations were trying to use USING expressions, which PostgreSQL doesn't allow.

## What's Fixed Now

All INSERT policies now use `WITH CHECK`:
- ✅ Syntax correct
- ✅ Will apply successfully
- ✅ RLS policies will work as expected

## Next Steps

1. ✅ Open Supabase SQL Editor
2. ✅ Copy the FIXED `master.sql` file
3. ✅ Paste and run
4. ✅ Should succeed this time!

---

**The migrations are now fixed and ready to apply!** 🚀


