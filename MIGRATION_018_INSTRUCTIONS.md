# Migration 018 - Step-by-Step Instructions

## ⚠️ CRITICAL: This migration requires TWO separate executions

PostgreSQL requires enum values to be committed in a separate transaction before they can be used. You **cannot** run everything in one go.

---

## Step 1: Add Enum Values (Run FIRST)

1. **Open Supabase Dashboard → SQL Editor**
2. **Open the file:** `ADD_ENUM_VALUES_FIRST.sql`
3. **Copy ALL content** (Cmd+A, Cmd+C / Ctrl+A, Ctrl+C)
4. **Paste into SQL Editor**
5. **Click "Run"** (or press Cmd+Enter / Ctrl+Enter)
6. **Wait for success:** You should see "Success. No rows returned"
7. **DO NOT run anything else yet!**

This adds `super_admin` and `company_admin` to the `user_role` enum and commits them.

---

## Step 2: Run Migration 018 (Run AFTER Step 1)

1. **In the SAME SQL Editor** (or refresh if needed)
2. **Open the file:** `MIGRATION_018_READY_TO_PASTE.sql`
3. **Copy ALL content** (Cmd+A, Cmd+C / Ctrl+A, Ctrl+C)
4. **Paste into SQL Editor** (this is a NEW query)
5. **Click "Run"** (or press Cmd+Enter / Ctrl+Enter)
6. **Wait for success:** You should see "Success. No rows returned"

This adds all the columns (`company_id`, `status`, `permissions`, etc.) and creates functions/triggers.

---

## Why Two Steps?

PostgreSQL's enum system requires new values to be committed in a separate transaction before they can be referenced. If you try to add an enum value and use it in the same transaction, you get the "unsafe use" error.

By running `ADD_ENUM_VALUES_FIRST.sql` separately, the enum values are committed, and then `MIGRATION_018_READY_TO_PASTE.sql` can safely reference them.

---

## Troubleshooting

### Error: "unsafe use of new value"
- **Cause:** You're trying to use the enum value in the same transaction where it was added
- **Fix:** Make sure you ran `ADD_ENUM_VALUES_FIRST.sql` FIRST as a separate execution, then run migration 018

### Error: "enum value already exists"
- **Cause:** The enum values were already added
- **Fix:** This is OK! Just proceed to Step 2 (run migration 018)

### Error: "relation companies does not exist"
- **Cause:** Migration 017 hasn't been run yet
- **Fix:** Run migration 017 first, then come back to migration 018

---

## Verification

After both steps complete, verify it worked:

```sql
-- Check if company_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('company_id', 'role', 'status', 'permissions');

-- Should return 4 rows
```

---

## Next Steps

After migration 018 succeeds:
1. ✅ Run `CHECK_MIGRATION_STATUS.sql` to see what's next
2. ➡️ Continue with migrations 019, 020, 021, 022


