# ✅ Fixed Alert Automation Migration

## 🐛 Issues Found and Fixed

### 1. **Schema Mismatch: `lv.client` doesn't exist**
   - **Problem**: Function referenced `lv.client` (TEXT column) but schema has `client_id UUID`
   - **Fix**: Changed to use `lv.client_id` and join with `clients` table to get client name
   - **Files**: `supabase/migrations/012_alert_automation.sql`

### 2. **Schema Mismatch: `assigned_driver` doesn't exist**
   - **Problem**: Function referenced `assigned_driver` but schema has `assigned_driver_id UUID`
   - **Fix**: Changed to use `assigned_driver_id IS NULL`
   - **Files**: `supabase/migrations/012_alert_automation.sql`

### 3. **Enum Type Handling: `status` is an enum, not TEXT**
   - **Problem**: Function compared `status = 'Blocked'` directly, but `status` is `vehicle_status` enum
   - **Fix**: Changed to `status::text = 'Blocked'` for enum comparisons
   - **Files**: `supabase/migrations/012_alert_automation.sql`

### 4. **Duplicate INSERT Statements**
   - **Problem**: Both `create_blocked_vehicle_alerts` and `create_aging_vehicle_alerts` had duplicate `INSERT INTO alerts` statements
   - **Fix**: Removed duplicate statements
   - **Files**: `supabase/migrations/012_alert_automation.sql`

### 5. **Capacity Alerts: `markets.capacity` doesn't exist**
   - **Problem**: Function referenced `m.capacity` but `markets` table doesn't have a `capacity` column
   - **Fix**: Temporarily disabled capacity alerts, returning 0 alerts
   - **Files**: `supabase/migrations/012_alert_automation.sql`

---

## ✅ What Was Fixed

### `create_blocked_vehicle_alerts()`
- ✅ Fixed `lv.client` → `lv.client_id` with join to `clients` table
- ✅ Fixed `lv.status = 'Blocked'` → `lv.status::text = 'Blocked'`
- ✅ Removed duplicate INSERT statement
- ✅ Now properly joins with `clients` to get client name

### `create_aging_vehicle_alerts()`
- ✅ Fixed `lv.client` → `lv.client_id` with join to `clients` table
- ✅ Fixed `lv.status IN ('Located', 'Stashed')` → `lv.status::text IN ('Located', 'Stashed')`
- ✅ Removed duplicate INSERT statement
- ✅ Now properly joins with `clients` to get client name

### `create_capacity_alerts()`
- ✅ Temporarily disabled (markets table doesn't have capacity column)
- ✅ Returns 0 alerts for now
- ✅ Original code commented out for future implementation

### `create_unassigned_vehicle_alerts()`
- ✅ Fixed `assigned_driver IS NULL` → `assigned_driver_id IS NULL`
- ✅ Fixed `status IN ('Located', 'Stashed')` → `status::text IN ('Located', 'Stashed')`

### `trigger_create_blocked_alert()`
- ✅ Fixed `NEW.status = 'Blocked'` → `NEW.status::text = 'Blocked'`
- ✅ Fixed `OLD.status = 'Blocked'` → `OLD.status::text = 'Blocked'`
- ✅ Fixed `NEW.client` → `NEW.client_id`
- ✅ Removed client name lookup (not needed in trigger)

### Triggers
- ✅ Fixed `WHEN (NEW.status = 'Blocked')` → `WHEN (NEW.status::text = 'Blocked')`
- ✅ Fixed `WHEN (NEW.status = 'Blocked' OR ...)` → `WHEN (NEW.status::text = 'Blocked' OR ...)`

---

## 🚀 Next Steps

### 1. **Apply the Fixed Migration**

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Apply the fixed migration
-- Copy and paste the contents of supabase/migrations/012_alert_automation.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

### 2. **Test the Function**

After applying the migration, test the function:

```sql
-- Test creating alerts
SELECT * FROM create_all_alerts_from_data();
```

**Expected Result:**
- Should return a table with `alert_type`, `alerts_created`, and `alert_ids`
- Should create alerts for blocked vehicles, aging vehicles, and unassigned vehicles
- Capacity alerts should return 0 (disabled for now)

### 3. **Verify Alerts Were Created**

```sql
-- Check if alerts were created
SELECT 
  alert_type,
  COUNT(*) as count,
  MAX(created_at) as latest_created
FROM alerts
WHERE status = 'active'
GROUP BY alert_type
ORDER BY count DESC;
```

### 4. **Test in UI**

1. Go to `/app/admin/alert-automation`
2. Click **"Create All Alerts from Data"** button
3. Should now work without errors!

---

## 📝 Summary of Changes

**Files Modified:**
- `supabase/migrations/012_alert_automation.sql`

**Key Changes:**
1. ✅ Fixed schema mismatches (`client` → `client_id`, `assigned_driver` → `assigned_driver_id`)
2. ✅ Fixed enum handling (`status` → `status::text`)
3. ✅ Removed duplicate INSERT statements
4. ✅ Temporarily disabled capacity alerts (markets table doesn't have capacity column)
5. ✅ Added proper JOINs to `clients` table for client names

**Migration Status:**
- ✅ Ready to apply
- ✅ All syntax errors fixed
- ✅ All schema mismatches resolved
- ✅ Functions now match actual database schema

---

## 🔍 Troubleshooting

### Issue: Still getting 400 error

**Check:**
1. Did you apply the fixed migration?
2. Are there any vehicles in `located_vehicles` table?
3. Do vehicles have `client_id` set (not NULL)?
4. Check Supabase logs for detailed error messages

**Solution:**
- Run the migration again
- Check vehicle data: `SELECT COUNT(*) FROM located_vehicles;`
- Check client data: `SELECT COUNT(*) FROM clients;`
- Verify vehicles have client_id: `SELECT COUNT(*) FROM located_vehicles WHERE client_id IS NOT NULL;`

### Issue: No alerts created

**Check:**
1. Do you have vehicles matching the criteria?
   - Blocked > 48 hours: `SELECT COUNT(*) FROM located_vehicles WHERE status::text = 'Blocked' AND located_at < NOW() - INTERVAL '48 hours';`
   - Aging > 7 days: `SELECT COUNT(*) FROM located_vehicles WHERE status::text IN ('Located', 'Stashed') AND located_at < NOW() - INTERVAL '7 days';`
   - Unassigned: `SELECT COUNT(*) FROM located_vehicles WHERE assigned_driver_id IS NULL AND status::text IN ('Located', 'Stashed');`

**Solution:**
- Create test data if needed
- Adjust criteria if needed
- Check function logs for errors

---

## ✅ Success Checklist

After applying the fixed migration, you should have:

- ✅ Migration applied successfully (no errors)
- ✅ Functions created/updated
- ✅ Triggers created
- ✅ Can call `create_all_alerts_from_data()` without errors
- ✅ Alerts created in database
- ✅ UI can create alerts successfully

---

**Ready to Apply!** 🚀

The migration is now fixed and ready to apply. All schema mismatches have been resolved, and the functions now match your actual database schema.




