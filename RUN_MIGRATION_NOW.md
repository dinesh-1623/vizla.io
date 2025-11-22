# 🚨 URGENT: Run Migration to Add Zip Codes Column

## Error You're Seeing
```
column zones.zip_codes does not exist
```

## Quick Fix

### Option 1: Run in Supabase SQL Editor (Easiest)

1. Go to your Supabase Dashboard
2. Click **SQL Editor** in the left sidebar
3. Copy and paste this SQL:

```sql
-- Add zip_codes column to zones table
ALTER TABLE zones 
ADD COLUMN IF NOT EXISTS zip_codes TEXT[] DEFAULT '{}';

-- Create index for zip code searches
CREATE INDEX IF NOT EXISTS idx_zones_zip_codes ON zones USING GIN(zip_codes);

-- Add comment
COMMENT ON COLUMN zones.zip_codes IS 'Array of zip codes that fall within this zone boundary';
```

4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see: "Success. No rows returned"
6. Refresh your app - the error should be gone!

### Option 2: Use Migration File

If you're using Supabase CLI:

```bash
# Make sure you're in the project root
cd /Users/dineshmotati/Downloads/driver-dash-view-main-2

# Run the migration
supabase db push
```

Or apply the migration file directly:

```bash
supabase migration up 009_add_zip_codes_to_zones
```

## Verify It Worked

After running the migration, check:

1. Go to Supabase Dashboard → Table Editor → `zones` table
2. You should see a new column called `zip_codes` (type: text[])
3. Refresh your app - the Zone Zip Code Manager should work!

## What This Does

- Adds `zip_codes` column as a TEXT array (can store multiple zip codes per zone)
- Creates an index for fast searches
- Sets default value to empty array `{}`

## After Migration

Once the column exists, you can:
1. Use the Zone Zip Code Manager page to manually add zip codes
2. Use the "Extract Zip Codes" button on the Zones page
3. See zip codes on the Operations Map

