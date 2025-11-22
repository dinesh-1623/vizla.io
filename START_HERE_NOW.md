# 🚀 START HERE: What to Do Right Now

## ✅ Quick Checklist (10 Minutes)

### 1️⃣ Apply Migration (5 minutes)

**Go to Supabase Dashboard:**
1. Open: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Click **"New Query"**
5. Open file: `supabase/migrations/012_alert_automation.sql`
6. **Copy the entire file content**
7. **Paste into SQL Editor**
8. Click **"Run"** or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

**✅ Verify it worked:**
```sql
-- Run this in SQL Editor to check
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'create_%_alerts';
```

**Expected result:** Should show 5 functions:
- `create_blocked_vehicle_alerts`
- `create_aging_vehicle_alerts`
- `create_capacity_alerts`
- `create_unassigned_vehicle_alerts`
- `create_all_alerts_from_data`

---

### 2️⃣ Deploy Edge Function (3 minutes)

**Option A: Using Supabase CLI (Recommended)**

```bash
# Make sure you're in the project directory
cd /Users/dineshmotati/Downloads/driver-dash-view-main-2

# Deploy the function
supabase functions deploy auto-prioritize-new-alerts

# If not logged in, login first:
# supabase login
```

**Option B: Using Supabase Dashboard**

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Click **"Create Function"**
3. Name: `auto-prioritize-new-alerts`
4. Copy content from: `supabase/functions/auto-prioritize-new-alerts/index.ts`
5. Paste and click **"Deploy"**

**✅ Verify it worked:**
- Go to **Supabase Dashboard** → **Edge Functions**
- Should see `auto-prioritize-new-alerts` in the list

---

### 3️⃣ Create Alerts from Data (2 minutes)

**Option A: Using UI (Easiest)**

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Go to Admin Panel**:
   - Navigate to: http://localhost:8080/app/admin/alert-automation
   - Or click **"Alert Automation"** in the sidebar (under Admin section)

3. **Click "Create All Alerts from Data"** button
4. **Wait for completion** (may take 10-30 seconds)
5. **Check results** - Should show count of alerts created

**Option B: Using SQL**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL:
   ```sql
   SELECT * FROM create_all_alerts_from_data();
   ```
3. **Check results** - Should show alerts created by type

**✅ Verify it worked:**
```sql
-- Check if alerts were created
SELECT 
  alert_type,
  COUNT(*) as count
FROM alerts
WHERE status = 'active'
GROUP BY alert_type;
```

---

### 4️⃣ Prioritize Alerts (2 minutes)

**Option A: Using UI (Easiest)**

1. **Go to Admin Panel**: `/app/admin/alert-automation`
2. **Click "Auto-Prioritize New Alerts"** button
3. **Wait for completion** (may take 10-30 seconds per alert)
4. **Check results** - Should show successful prioritizations

**Option B: Using Edge Function**

1. Go to **Supabase Dashboard** → **Edge Functions** → **auto-prioritize-new-alerts**
2. Click **"Invoke"** or **"Test"**
3. Use this payload:
   ```json
   {
     "alertIds": [],
     "batchSize": 10,
     "maxBatchSize": 50
   }
   ```
4. Click **"Invoke"**
5. **Check results** - Should show prioritized alerts

**✅ Verify it worked:**
```sql
-- Check if alerts have AI priorities
SELECT 
  a.title,
  aip.priority_score,
  aip.priority_level,
  aip.short_reason
FROM alerts a
LEFT JOIN alert_ai_priorities aip ON a.id = aip.alert_id
WHERE a.status = 'active'
ORDER BY aip.priority_score DESC NULLS LAST
LIMIT 5;
```

---

### 5️⃣ View in Dashboard (1 minute)

1. **Go to Dashboard**: http://localhost:8080/app/dashboard
2. **Look for "✨ AI-Powered Alerts"** badge
3. **Check alert cards** - Should show:
   - Priority scores (0-100)
   - Priority levels (Low/Medium/High/Critical)
   - AI reasoning (expandable)
   - Recommended actions (expandable)

4. **Click "Show Details"** on an alert to see full AI analysis

**✅ Verify it worked:**
- Should see AI-powered alerts in Dashboard
- Should see priority badges and scores
- Should be able to expand details

---

## 🎉 That's It!

You've successfully set up Alert Automation! 

**What's Now Automated:**
- ✅ Alerts are created from real vehicle data
- ✅ Alerts are automatically prioritized with AI
- ✅ Dashboard shows AI-powered alerts
- ✅ Admin panel shows monitoring data

---

## 🔍 Troubleshooting

### Issue: Migration fails

**Check:**
- Is migration `011_alert_prioritization.sql` applied first?
- Are tables `alerts` and `alert_ai_priorities` created?
- Check SQL Editor for error messages

**Solution:**
- Apply migration `011_alert_prioritization.sql` first if not applied
- Check for syntax errors in the SQL file
- Verify tables exist: `SELECT * FROM alerts LIMIT 1;`

### Issue: Edge Function deployment fails

**Check:**
- Is Supabase CLI installed? `supabase --version`
- Are you logged in? `supabase login`
- Is project linked? `supabase projects list`

**Solution:**
- Install Supabase CLI: `npm install -g supabase`
- Login: `supabase login`
- Link project: `supabase link --project-ref YOUR_PROJECT_REF`
- Or use Supabase Dashboard to deploy manually

### Issue: No alerts created

**Check:**
- Do you have vehicle data in `located_vehicles`?
- Do vehicles match criteria (blocked > 48h, aging > 7 days)?
- Are RLS policies allowing function execution?

**Solution:**
- Check vehicle data: `SELECT COUNT(*) FROM located_vehicles;`
- Check blocked vehicles: `SELECT COUNT(*) FROM located_vehicles WHERE status = 'Blocked';`
- Run function manually: `SELECT * FROM create_blocked_vehicle_alerts();`

### Issue: Alerts not prioritized

**Check:**
- Is `OPENAI_API_KEY` set in Supabase secrets?
- Are Edge Function logs showing errors?
- Is Edge Function deployed correctly?

**Solution:**
- Check Supabase secrets: Dashboard → Settings → Edge Functions → Secrets
- Check Edge Function logs: Dashboard → Edge Functions → Logs
- Test Edge Function directly: Dashboard → Edge Functions → Test

### Issue: Dashboard not showing alerts

**Check:**
- Is feature flag enabled? `VITE_ENABLE_AI_ALERT_PRIORITIZATION=true`
- Did you restart dev server after adding feature flag?
- Are alerts in database with `status = 'active'`?

**Solution:**
- Check `.env` file: `grep VITE_ENABLE_AI_ALERT_PRIORITIZATION .env`
- Restart dev server: `npm run dev`
- Check browser console for errors
- Verify alerts exist: `SELECT COUNT(*) FROM alerts WHERE status = 'active';`

---

## 📊 What You Should See

### After Step 1 (Migration):
- ✅ SQL functions created in database
- ✅ Database triggers created
- ✅ Monitoring views created

### After Step 2 (Edge Function):
- ✅ Edge Function deployed and available
- ✅ Can be called via HTTP or from triggers

### After Step 3 (Alerts Created):
- ✅ Alerts in database
- ✅ Alerts visible in admin panel
- ✅ Alert counts shown

### After Step 4 (Alerts Prioritized):
- ✅ AI priorities assigned
- ✅ Priority scores and levels
- ✅ AI reasoning and recommendations

### After Step 5 (Dashboard):
- ✅ AI-powered alerts visible
- ✅ Priority badges showing
- ✅ Expandable details available

---

## 🚀 Next Steps (Optional)

### Schedule Automation

If you want alerts to be created automatically:

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Run this SQL**:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule alert creation every hour
SELECT cron.schedule(
  'create-alerts-hourly',
  '0 * * * *',
  $$SELECT create_all_alerts_from_data();$$
);
```

### Monitor Performance

1. **Go to Admin Panel**: `/app/admin/alert-automation`
2. **View "Current Alert Summary"** - Shows active alerts
3. **View "Alert Performance by Priority"** - Shows resolution rates
4. **Track performance over time** - Monitor resolution rates and times

---

## 📝 Summary

**Do These 5 Steps:**

1. ✅ **Apply migration** - Run `012_alert_automation.sql` in Supabase SQL Editor
2. ✅ **Deploy Edge Function** - Deploy `auto-prioritize-new-alerts`
3. ✅ **Create alerts** - Use UI or SQL to create alerts from data
4. ✅ **Prioritize alerts** - Use UI or Edge Function to prioritize alerts
5. ✅ **View in Dashboard** - See AI-powered alerts in `/app/dashboard`

**Time Required:** ~10-15 minutes

**Result:** Fully automated alert system with AI prioritization!

---

## 🎯 Ready to Start?

**Start with Step 1: Apply the Migration**

1. Go to Supabase Dashboard → SQL Editor
2. Copy content from `supabase/migrations/012_alert_automation.sql`
3. Paste and run
4. Verify functions are created

**Then proceed to Steps 2, 3, 4, and 5!**

---

**Need Help?**
- Check `ACTION_PLAN_NOW.md` for detailed step-by-step instructions
- Check `ALERT_AUTOMATION_SETUP.md` for complete setup guide
- Check browser console for errors
- Check Supabase logs for issues




